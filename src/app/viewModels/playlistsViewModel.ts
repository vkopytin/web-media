import * as _ from 'underscore';
import { AppService } from '../service';
import { DataService } from '../service/dataService';
import { LyricsService } from '../service/lyricsService';
import { MediaService } from '../service/mediaService';
import { isLoading, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';

class PlaylistsViewModel {
    settings = this.defaultSettings();

    @State errors: Result[] = [];
    @State playlists: PlaylistsViewModelItem[] = [];
    @State tracks: TrackViewModelItem[] = [];
    @State isLoading = false;
    @State likedTracks: TrackViewModelItem[] = [];
    @State currentPlaylistId: string | null = null;
    @State newPlaylistName = '';
    @State selectedItem: TrackViewModelItem | null = null;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;
    @State bannedTrackIds: string[] = [];

    @State selectPlaylistCommand = Scheduler.Command((playlistId: string | null) => {
        this.currentPlaylistId = playlistId;
        this.fetchTracks();
    });
    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());
    @State loadMoreTracksCommand = Scheduler.Command(() => this.loadMoreTracks());
    @State createPlaylistCommand = Scheduler.Command((isPublic: boolean) => this.createNewPlaylist(isPublic));
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));
    @State reorderTrackCommand = Scheduler.Command((track: TrackViewModelItem, beforeTrack: TrackViewModelItem) => this.reorderTrack(track, beforeTrack));
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));

    constructor(
        private data: DataService,
        private media: MediaService,
        private lyrics: LyricsService,
        private app: AppService
    ) {

    }

    async init() {
        this.settings = this.defaultSettings();
        await this.fetchData();
    }

    defaultSettings() {
        return {
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
    }

    async fetchData(): Promise<void> {
        const result = await this.media.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        result.map(({ items: playlists }) => {
            this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
            this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
            this.playlists = _.map(_.first(playlists, this.settings.playlist.limit), item => new PlaylistsViewModelItem(item));
        }).error(e => this.errors = [Result.error(e)]);
    }

    @isLoading
    async loadMore(): Promise<void> {
        const result = await this.media.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        result.map(({ items: playlists }) => {
            this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
            this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
            this.playlists = [...this.playlists, ..._.map(_.first(playlists, this.settings.playlist.limit), item => new PlaylistsViewModelItem(item))];
        }).error(e => this.errors = [Result.error(e)]);
    }

    async fetchTracks(): Promise<void> {
        this.settings.track.offset = 0;
        this.settings.track.total = 0;
        const currentPlaylistId = this.currentPlaylistId;
        this.tracks = [];
        if (currentPlaylistId) {
            this.loadTracks('playlistTracks');
            const result = await this.media.fetchPlaylistTracks(currentPlaylistId, this.settings.track.offset, this.settings.track.limit + 1);
            result.map(({ items: tracks }) => {
                this.settings.track.total = this.settings.track.offset + Math.min(this.settings.track.limit + 1, tracks.length);
                this.settings.track.offset = this.settings.track.offset + Math.min(this.settings.track.limit, tracks.length);
                this.tracks = _.map(_.first(tracks, this.settings.track.limit), (item, index) => new TrackViewModelItem(item, index));
                this.checkTracks(this.tracks);
            }).error(e => this.errors = [Result.error(e)]);
        }
    }

    async loadMoreTracks(): Promise<void> {
        const currentPlaylistId = this.currentPlaylistId;
        if (currentPlaylistId) {
            const result = await this.media.fetchPlaylistTracks(currentPlaylistId, this.settings.track.offset, this.settings.track.limit + 1);
            result.map(({ items: tracks }) => {
                this.settings.track.total = this.settings.track.offset + Math.min(this.settings.track.limit + 1, tracks.length);
                this.settings.track.offset = this.settings.track.offset + Math.min(this.settings.track.limit, tracks.length);
                const moreTracks = _.map(_.first(tracks, this.settings.track.limit), (item, index) => new TrackViewModelItem(item, index));
                this.tracks = [
                    ...this.tracks,
                    ...moreTracks
                ];
                this.checkTracks(moreTracks);
            }).error(e => this.errors = [Result.error(e)]);
        }
    }

    async loadTracks(...args: unknown[]): Promise<void> {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[]): Promise<void> {
        const tracksToCheck = tracks;
        this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        if (!tracksToCheck.length) {
            return;
        }
        const likedResult = await this.media.hasTracks(_.map(tracksToCheck, t => t.id()));
        likedResult.map(likedList => {
            _.each(likedList, (liked, index) => {
                tracksToCheck[index].isLiked = liked;
            });
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        }).error(e => this.errors = [Result.error(e)]);
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));
        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]): void {
        const array = [...this.playlists, ...value];
        this.playlists = array;
    }

    async createNewPlaylist(isPublic: boolean): Promise<void> {
        if (!this.newPlaylistName) {
            return;
        }
        const meResult = await this.media.profile();
        const meId = meResult.map(me => {
            if (me.id) {
                return me.id;
            }
            this.errors = [Result.error(new Error('My profile Id is empty'))];
        });
        const appResult = await meId.cata(id => this.app.createNewPlaylist(
            id,
            this.newPlaylistName,
            '',
            isPublic
        ));
        const fetchDataResult = await appResult.map(() => this.fetchData()).await();
        fetchDataResult.error(e => this.errors = [Result.error(e)]);
    }

    async likeTrack(track: TrackViewModelItem): Promise<void> {
        await track.likeTrack();
        await this.checkTracks([track]);
    }

    async unlikeTrack(track: TrackViewModelItem): Promise<void> {
        await track.unlikeTrack();
        await this.checkTracks([track]);
    }

    async findTrackLyrics(track: TrackViewModelItem): Promise<void> {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            this.trackLyrics = null;
            return;
        }
        const lyricsResult = await this.lyrics.search({
            name: track.name(),
            artist: track.artist()
        });
        lyricsResult.error(e => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: e.message || 'unknown-error'
            };
            return;
        }).map(val => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: '' + val
            };
        });
    }

    async reorderTrack(track: TrackViewModelItem, beforeTrack: TrackViewModelItem): Promise<void> {
        const tracks = this.tracks;
        const oldPosition = tracks.indexOf(track);
        const newPosition = tracks.indexOf(beforeTrack);
        const data = [...tracks];
        const item = data.splice(oldPosition, 1)[0];
        data.splice(newPosition, 0, item);
        this.tracks = data;
        let res;
        if (!this.currentPlaylistId) {
            return;
        }

        if (oldPosition < newPosition) {
            res = await this.media.reorderTracks(this.currentPlaylistId, oldPosition, newPosition + 1);
        } else if (oldPosition > newPosition) {
            res = await this.media.reorderTracks(this.currentPlaylistId, oldPosition, newPosition);
        }
        res?.error(e => this.errors = [Result.error(e)]);
    }

    @isLoading
    async bannTrack(track: TrackViewModelItem): Promise<void> {
        await track.bannTrack();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    @isLoading
    async removeBannFromTrack(track: TrackViewModelItem): Promise<void> {
        await track.removeBannFromTrack();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }
}

export { PlaylistsViewModel };

