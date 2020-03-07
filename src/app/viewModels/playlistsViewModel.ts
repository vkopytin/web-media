import { ViewModel } from '../base/viewModel';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { IUserPlaylistsResult, IResponseResult, ISpotifySong, IUserPlaylist, ITrack, IUserInfo } from '../adapter/spotify';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { current, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';
import { listPlaylists, listTracksByPlaylist } from '../data/useCases';


class PlaylistsViewModel extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
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
        newPlaylistName: ''
    };

    selectPlaylistCommand = {
        exec: (playlistId: string) => {
            this.currentPlaylistId(playlistId);
        }
    };
    loadMoreCommand = {
        exec: () => this.loadMore()
    };
    loadMoreTracksCommand = {
        exec: () => this.loadMoreTracks()
    };
    createPlaylistCommand = {
        exec: (isPublic: boolean) => this.createNewPlaylist(isPublic)
    };

    playlistsArray = [] as PlaylistsViewModelItem[];
    tracksArray = [] as TrackViewModelItem[];

    isInit = _.delay(() => {
        this.connect();
        this.loadData('myPlaylists');
        this.fetchData();
    });

    constructor(private ss = current(Service)) {
        super();
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        const spotify = spotifyResult.val;
        spotify.on('change:state', (...args) => this.loadData(...args));
    }

    async fetchData() {
        const result = await this.ss.fetchMyPlaylists(this.settings.playlist.offset, this.settings.playlist.limit + 1);
        if (assertNoErrors(result, e => this.errors(e))) {
            return result;
        }
        const playlists = (result.val as IUserPlaylistsResult).items;
        this.settings.playlist.total = this.settings.playlist.offset + Math.min(this.settings.playlist.limit + 1, playlists.length);
        this.settings.playlist.offset = this.settings.playlist.offset + Math.min(this.settings.playlist.limit, playlists.length);
        this.playlists(_.map(playlists, item => new PlaylistsViewModelItem(item)));
    }

    async loadData(...args) {
        this.loadTracks(...args);
        if (!~args.indexOf('myPlaylists')) {
            return;
        }
        const playlists = await listPlaylists(0, this.settings.playlist.total);
        this.playlists(_.map(playlists, item => new PlaylistsViewModelItem(item)));
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
        this.playlists([...this.playlists(), ..._.map(playlists, item => new PlaylistsViewModelItem(item))]);
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
            this.tracks(_.map(tracks, (item, index) => new TrackViewModelItem(item, index)));
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
            this.tracks(_.map(tracks, (item, index) => new TrackViewModelItem(item, index)));
            this.checkTracks(this.tracks());
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

    likedTracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.settings.likedTracks !== val) {
            this.settings.likedTracks = val;
            this.trigger('change:likedTracks');
        }

        return this.settings.likedTracks;
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]) {
        const array = [...this.playlistsArray, ...value];
        this.playlists(array);
    }

    isLoading(val?) {
        if (arguments.length && val !== this.settings.isLoading) {
            this.settings.isLoading = val;
            this.trigger('change:isLoading');
        }

        return this.settings.isLoading;
    }

    playlists(val?: PlaylistsViewModelItem[]) {
        if (arguments.length && this.playlistsArray !== val) {
            this.playlistsArray = val;
            this.trigger('change:playlists');
        }

        return this.playlistsArray;
    }

    tracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.tracksArray !== val) {
            this.tracksArray = val;
            this.trigger('change:tracks');
        }

        return this.tracksArray;
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
}

export { PlaylistsViewModel };
