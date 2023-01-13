import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, isLoading, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';

class PlaylistsViewModel {
    errors$!: BehaviorSubject<PlaylistsViewModel['errors']>;
    @State errors = [] as ServiceResult<unknown, Error>[];

    playlists$!: BehaviorSubject<PlaylistsViewModel['playlists']>;
    @State playlists = [] as PlaylistsViewModelItem[];

    tracks$!: BehaviorSubject<PlaylistsViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    isLoading$!: BehaviorSubject<PlaylistsViewModel['isLoading']>;
    @State isLoading = false;

    likedTracks$!: BehaviorSubject<PlaylistsViewModel['likedTracks']>;
    @State likedTracks = [] as TrackViewModelItem[];

    currentPlaylistId$!: BehaviorSubject<PlaylistsViewModel['currentPlaylistId']>;
    @State currentPlaylistId = '';

    newPlaylistName$!: BehaviorSubject<PlaylistsViewModel['newPlaylistName']>;
    @State newPlaylistName = '';

    selectedItem$!: BehaviorSubject<PlaylistsViewModel['selectedItem']>;
    @State selectedItem: TrackViewModelItem | null = null;

    trackLyrics$!: BehaviorSubject<PlaylistsViewModel['trackLyrics']>;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;

    bannedTrackIds$!: BehaviorSubject<PlaylistsViewModel['bannedTrackIds']>;
    @State bannedTrackIds = [] as string[];

    settings = {
        ...(this as any as ViewModel).settings,
        tracks: [] as TrackViewModelItem[],

        currentPlaylistId: '',
        playlist: {
            offset: 0,
            limit: 20,
            total: 0
        },
        track: {
            offset: 0,
            limit: 20,
            total: 0
        },
        isLoading: false,
        newPlaylistName: '',
    };

    selectPlaylistCommand$!: BehaviorSubject<PlaylistsViewModel['selectPlaylistCommand']>;
    @State selectPlaylistCommand = Scheduler.Command((playlistId: string) => {
        this.currentPlaylistId = playlistId;
        this.fetchTracks();
    });
    loadMoreCommand$!: BehaviorSubject<PlaylistsViewModel['loadMoreCommand']>;
    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());
    loadMoreTracksCommand$!: BehaviorSubject<PlaylistsViewModel['loadMoreTracksCommand']>;
    @State loadMoreTracksCommand = Scheduler.Command(() => this.loadMoreTracks());
    createPlaylistCommand$!: BehaviorSubject<PlaylistsViewModel['createPlaylistCommand']>;
    @State createPlaylistCommand = Scheduler.Command((isPublic: boolean) => this.createNewPlaylist(isPublic));
    likeTrackCommand$!: BehaviorSubject<PlaylistsViewModel['likeTrackCommand']>;
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));
    unlikeTrackCommand$!: BehaviorSubject<PlaylistsViewModel['unlikeTrackCommand']>;
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));
    findTrackLyricsCommand$!: BehaviorSubject<PlaylistsViewModel['findTrackLyricsCommand']>;
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));
    reorderTrackCommand$!: BehaviorSubject<PlaylistsViewModel['reorderTrackCommand']>;
    @State reorderTrackCommand = Scheduler.Command((track: TrackViewModelItem, beforeTrack: TrackViewModelItem) => this.reorderTrack(track, beforeTrack));

    bannTrackCommand$!: BehaviorSubject<PlaylistsViewModel['bannTrackCommand']>;
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));
    removeBannFromTrackCommand$!: BehaviorSubject<PlaylistsViewModel['removeBannFromTrackCommand']>;
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        resolve(true);
    }));

    constructor(private ss = current(Service)) {

    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        spotifyResult.assert(e => this.errors = [e]);
    }

    async fetchData() {
        const result = await this.ss.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        result.assert(e => this.errors = [e]).cata(({ items: playlists }) => {
            this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
            this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
            this.playlists = _.map(_.first(playlists, this.settings.playlist.limit), item => new PlaylistsViewModelItem(item));
        });
    }

    @isLoading
    async loadMore() {
        const result = await this.ss.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        result.assert(e => this.errors = [e]).cata(({ items: playlists }) => {
            this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
            this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
            this.playlists = [...this.playlists, ..._.map(_.first(playlists, this.settings.playlist.limit), item => new PlaylistsViewModelItem(item))];
        });
    }

    async fetchTracks() {
        this.settings.track.offset = 0;
        this.settings.track.total = 0;
        const currentPlaylistId = this.currentPlaylistId;
        this.tracks = [];
        if (currentPlaylistId) {
            this.loadTracks('playlistTracks');
            const result = await this.ss.fetchPlaylistTracks(currentPlaylistId, this.settings.track.offset, this.settings.track.limit + 1);
            result.assert(e => this.errors = [e]).cata(({ items: tracks }) => {
                this.settings.track.total = this.settings.track.offset + Math.min(this.settings.track.limit + 1, tracks.length);
                this.settings.track.offset = this.settings.track.offset + Math.min(this.settings.track.limit, tracks.length);
                this.tracks = _.map(_.first(tracks, this.settings.track.limit), (item, index) => new TrackViewModelItem(item, index));
                this.checkTracks(this.tracks);
            });
        }
    }

    async loadMoreTracks() {
        const currentPlaylistId = this.currentPlaylistId;
        if (currentPlaylistId) {
            const result = await this.ss.fetchPlaylistTracks(currentPlaylistId, this.settings.track.offset, this.settings.track.limit + 1);
            result.assert(e => this.errors = [e]).cata(({ items: tracks }) => {
                this.settings.track.total = this.settings.track.offset + Math.min(this.settings.track.limit + 1, tracks.length);
                this.settings.track.offset = this.settings.track.offset + Math.min(this.settings.track.limit, tracks.length);
                const moreTracks = _.map(_.first(tracks, this.settings.track.limit), (item, index) => new TrackViewModelItem(item, index));
                this.tracks = [
                    ...this.tracks,
                    ...moreTracks
                ];
                this.checkTracks(moreTracks);
            });
        }
    }

    async loadTracks(...args: unknown[]) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[]) {
        const tracksToCheck = tracks;
        this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        if (!tracksToCheck.length) {
            return;
        }
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        likedResult.assert(e => this.errors = [e]).cata(likedList => {
            _.each(likedList, (liked, index) => {
                tracksToCheck[index].isLiked = liked;
            });
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        });
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));
        res.assert(e => this.errors = [e]).cata(r => this.bannedTrackIds = r);
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]) {
        const array = [...this.playlists, ...value];
        this.playlists = array;
    }

    async createNewPlaylist(isPublic: boolean) {
        if (!this.newPlaylistName) {
            return;
        }
        const meResult = await this.ss.profile();
        const meId = meResult.map(me => {
            if (me.id) {
                return me.id;
            }
            throw new Error('My profile Id is empty');
        });
        const spotifyResult = await meId.cata(id => this.ss.createNewPlaylist(
            id,
            this.newPlaylistName,
            '',
            isPublic
        ));
        await spotifyResult.assert(e => this.errors = [e]).cata(() => this.fetchData());
    }

    async likeTrack(track: TrackViewModelItem) {
        await track.likeTrack();
        await this.checkTracks([track]);
    }

    async unlikeTrack(track: TrackViewModelItem) {
        await track.unlikeTrack();
        await this.checkTracks([track]);
    }

    async findTrackLyrics(track: TrackViewModelItem): Promise<void> {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            this.trackLyrics = null;
            return;
        }
        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        if (assertNoErrors(lyricsResult, () => { })) {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: lyricsResult.error.message
            };
            return;
        }

        this.trackLyrics = {
            trackId: track.id(),
            lyrics: '' + lyricsResult.val
        };
    }

    async reorderTrack(track: TrackViewModelItem, beforeTrack: TrackViewModelItem) {
        const tracks = this.tracks;
        const oldPosition = tracks.indexOf(track);
        const newPosition = tracks.indexOf(beforeTrack);
        const data = [...tracks];
        const item = data.splice(oldPosition, 1)[0];
        data.splice(newPosition, 0, item);
        this.tracks = data;
        let res;
        if (oldPosition < newPosition) {
            res = await this.ss.reorderTrack(this.currentPlaylistId, oldPosition, newPosition + 1);
        } else if (oldPosition > newPosition) {
            res = await this.ss.reorderTrack(this.currentPlaylistId, oldPosition, newPosition);
        }
        res?.assert(e => this.errors = [e]);
    }

    @isLoading
    async bannTrack(track: TrackViewModelItem) {
        await track.bannTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.assert(e => this.errors = [e]).cata(r => this.bannedTrackIds = r);
    }

    @isLoading
    async removeBannFromTrack(track: TrackViewModelItem) {
        await track.removeBannFromTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.assert(e => this.errors = [e]).cata(r => this.bannedTrackIds = r);
    }
}

export { PlaylistsViewModel };

