import * as _ from 'underscore';
import { IResponseResult, ISpotifySong, IUserInfo, IUserPlaylistsResult } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, current } from '../utils';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { SpotifyService } from '../service/spotify';


class PlaylistsViewModel extends ViewModel<PlaylistsViewModel['settings']> {

    settings = {
        ...(this as any as ViewModel).settings,
        playlists: [] as PlaylistsViewModelItem[],
        tracks: [] as TrackViewModelItem[],
        openLogin: false,
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
        likedTracks: [] as TrackViewModelItem[],
        selectedTrack: null as TrackViewModelItem,
        newPlaylistName: '',
        trackLyrics: null as { trackId: string; lyrics: string }
    };

    selectPlaylistCommand = { exec: (playlistId: string) => this.currentPlaylistId(playlistId) };
    loadMoreCommand = { exec: () => this.loadMore() };
    loadMoreTracksCommand = { exec: () => this.loadMoreTracks() };
    createPlaylistCommand = { exec: (isPublic: boolean) => this.createNewPlaylist(isPublic) };
    likeTrackCommand = { exec: (track: TrackViewModelItem) => this.likeTrack(track) };
    unlikeTrackCommand = { exec: (track: TrackViewModelItem) => this.unlikeTrack(track) };
    findTrackLyricsCommand = { exec: (track: TrackViewModelItem) => this.findTrackLyrics(track) };
    reorderTrackCommand = {
        exec: (track: TrackViewModelItem, beforeTrack: TrackViewModelItem) => this.reorderTrack(track, beforeTrack)
    };

    isInit = _.delay(() => {
        this.connect();
        this.fetchData();
    });

    constructor(private ss = current(Service)) {
        super();
    }

    isLoading(val?) {
        if (arguments.length && val !== this.settings.isLoading) {
            this.settings.isLoading = val;
            this.trigger('change:isLoading');
        }

        return this.settings.isLoading;
    }

    playlists(val?: PlaylistsViewModelItem[]) {
        if (arguments.length && this.settings.playlists !== val) {
            this.settings.playlists = val;
            this.trigger('change:playlists');
        }

        return this.settings.playlists;
    }

    tracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.settings.tracks !== val) {
            this.settings.tracks = val;
            this.trigger('change:tracks');
        }

        return this.settings.tracks;
    }

    currentPlaylistId(val?: string) {
        if (arguments.length && this.settings.currentPlaylistId !== val) {
            this.settings.currentPlaylistId = val;
            this.trigger('change:currentPlaylistId');
            _.delay(() => this.fetchTracks());
        }

        return this.settings.currentPlaylistId;
    }

    selectedTrack(val: TrackViewModelItem) {
        if (arguments.length && this.settings.selectedTrack !== val) {
            this.settings.selectedTrack = val;
            this.trigger('change:selectedTrack');
        }

        return this.settings.selectedTrack;
    }

    newPlaylistName(val?: string) {
        if (arguments.length && this.settings.newPlaylistName !== val) {
            this.settings.newPlaylistName = val;
            this.trigger('change:newPlaylistName');
        }

        return this.settings.newPlaylistName;
    }

    likedTracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.settings.likedTracks !== val) {
            this.settings.likedTracks = val;
            this.trigger('change:likedTracks');
        }

        return this.settings.likedTracks;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        const spotify = spotifyResult.val;
    }

    async fetchData() {
        const result = await this.ss.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        if (assertNoErrors(result, e => this.errors(e))) {
            return result;
        }
        const playlists = (result.val as IUserPlaylistsResult).items;
        this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
        this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
        this.playlists(_.map(_.first(playlists, this.settings.playlist.limit), item => new PlaylistsViewModelItem(item)));
    }

    async loadMore() {
        this.isLoading(true);
        const result = await this.ss.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        if (assertNoErrors(result, e => this.errors(e))) {
            this.isLoading(false);
            return result;
        }
        const playlists = (result.val as IUserPlaylistsResult).items;
        this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
        this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
        this.playlists([...this.playlists(), ..._.map(_.first(playlists, this.settings.playlist.limit), item => new PlaylistsViewModelItem(item))]);
        this.isLoading(false);
    }

    async fetchTracks() {
        this.settings.track.offset = 0;
        this.settings.track.total = 0;
        const currentPlaylistId = this.currentPlaylistId();
        this.tracks([]);
        if (currentPlaylistId) {
            this.loadTracks('playlistTracks');
            const result = await this.ss.fetchPlaylistTracks(currentPlaylistId, this.settings.track.offset, this.settings.track.limit + 1);
            if (assertNoErrors(result, e => this.errors(e))) {
                return;
            }
            const tracks = (result.val as IResponseResult<ISpotifySong>).items;
            this.settings.track.total = this.settings.track.offset + Math.min(this.settings.track.limit + 1, tracks.length);
            this.settings.track.offset = this.settings.track.offset + Math.min(this.settings.track.limit, tracks.length);    
            this.tracks(_.map(_.first(tracks, this.settings.track.limit), (item, index) => new TrackViewModelItem(item, index)));
            this.checkTracks(this.tracks());
        }
    }

    async loadMoreTracks() {
        const currentPlaylistId = this.currentPlaylistId();
        if (currentPlaylistId) {
            const result = await this.ss.fetchPlaylistTracks(currentPlaylistId, this.settings.track.offset, this.settings.track.limit + 1);
            if (assertNoErrors(result, e => this.errors(e))) {
                return;
            }
            const tracks = (result.val as IResponseResult<ISpotifySong>).items;
            this.settings.track.total = this.settings.track.offset + Math.min(this.settings.track.limit + 1, tracks.length);
            this.settings.track.offset = this.settings.track.offset + Math.min(this.settings.track.limit, tracks.length);    
            const moreTracks = _.map(_.first(tracks, this.settings.track.limit), (item, index) => new TrackViewModelItem(item, index));
            this.tracks([
                ...this.tracks(),
                ...moreTracks
            ]);
            this.checkTracks(moreTracks);
        }
    }

    async loadTracks(...args) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[]) {
        const tracksToCheck = tracks;
        this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
        if (!tracksToCheck.length) {
            return;
        }
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked(liked);
        });
        this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]) {
        const array = [...this.settings.playlists, ...value];
        this.playlists(array);
    }

    async createNewPlaylist(isPublic: boolean) {
        if (!this.newPlaylistName()) {
            return;
        }
        const meResult = await this.ss.profile();
        if (assertNoErrors(meResult, e => this.errors(e))) {
            return;
        }
        const me = meResult.val as IUserInfo;
        const spotifyResult = await this.ss.createNewPlaylist(
            me.id,
            this.newPlaylistName(),
            '',
            isPublic
        );
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        this.fetchData();
    }

    async likeTrack(track: TrackViewModelItem) {
        await track.likeTrack();
        this.checkTracks([track]);
    }

    async unlikeTrack(track: TrackViewModelItem) {
        await track.unlikeTrack();
        this.checkTracks([track]);
    }

    async findTrackLyrics(track: TrackViewModelItem) {
        if (this.prop('trackLyrics') && this.prop('trackLyrics').trackId === track.id()) {
            return this.prop('trackLyrics', null);
        }
        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        if (assertNoErrors(lyricsResult, e => { })) {
            this.prop('trackLyrics', {
                trackId: track.id(),
                lyrics: lyricsResult.error.message
            });
            return;
        }

        this.prop('trackLyrics', {
            trackId: track.id(),
            lyrics: '' + lyricsResult.val
        });
    }

    async reorderTrack(track: TrackViewModelItem, beforeTrack: TrackViewModelItem) {
        const tracks = this.tracks();
        const oldPosition = tracks.indexOf(track);
        const newPosition = tracks.indexOf(beforeTrack);
        const data = [...tracks];
        const item = data.splice(oldPosition, 1)[0];
        data.splice(newPosition, 0, item);
        this.tracks(data);
        let res;
        if (oldPosition < newPosition) {
            res = await this.ss.reorderTrack(this.currentPlaylistId(), oldPosition, newPosition + 1);
        } else if (oldPosition > newPosition) {
            res = await this.ss.reorderTrack(this.currentPlaylistId(), oldPosition, newPosition);
        }
        if (assertNoErrors(res, e => this.errors(e))) {
            return;
        }
    }
}

export { PlaylistsViewModel };

