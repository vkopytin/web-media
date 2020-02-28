import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { IUserPlaylistsResult, IResponseResult, ISpotifySong, IUserPlaylist, ITrack } from '../service/adapter/spotify';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { current, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';


class PlaylistsViewModel extends Events {

    settings = {
        errors: [] as ServiceResult<any, Error>[],
        openLogin: false,
        currentPlaylistId: '',
        offset: 0,
        limit: 20,
        total: 0,
        isLoading: false
    };

    selectPlaylistCommand = {
        exec: (playlistId: string) => {
            this.currentPlaylistId(playlistId);
        }
    };
    loadMoreCommand = {
        exec: () => this.loadMore()
    };

    playlistsArray = [] as PlaylistsViewModelItem[];
    tracksArray = [] as TrackViewModelItem[];

    isInit = _.delay(() => {
        this.connect();
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
        const result = await this.ss.fetchMyPlaylists(this.settings.offset, this.settings.limit);
        if (assertNoErrors(result, e => this.errors(e))) {
            return result;
        }
        const playlists = (result.val as IUserPlaylistsResult).items;
        this.settings.total = this.settings.offset + Math.min(this.settings.limit - 1, playlists.length - 1) + 1;
        this.settings.offset = this.settings.offset + Math.min(this.settings.limit, playlists.length);
    }

    async loadData(...args) {
        this.loadTracks(...args);
        if (!~args.indexOf('myPlaylists')) {
            return;
        }
        const result = await this.ss.myPlaylists();
        if (assertNoErrors(result, e => this.errors(e))) {
            return result;
        }

        const playlists = result.val as IUserPlaylist[];

        this.playlists(_.map(playlists, item => new PlaylistsViewModelItem(item)));
    }

    async loadMore() {
        this.isLoading(true);
        const result = await this.ss.fetchMyPlaylists(this.settings.offset, this.settings.limit);
        if (assertNoErrors(result, e => this.errors(e))) {
            this.isLoading(false);
            return result;
        }
        const playlists = (result.val as IUserPlaylistsResult).items;
        this.settings.total = this.settings.offset + Math.min(this.settings.limit - 1, playlists.length - 1) + 1;
        this.settings.offset = this.settings.offset + Math.min(this.settings.limit, playlists.length);
        this.isLoading(false);
    }

    async fetchTracks() {
        const currentPlaylistId = this.currentPlaylistId();
        if (currentPlaylistId) {
            const result = await this.ss.fetchPlaylistTracks(currentPlaylistId);
            if (assertNoErrors(result, e => this.errors(e))) {
                return;
            }
        }
    }

    async loadTracks(...args) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
        const currentPlaylistId = this.currentPlaylistId();
        if (currentPlaylistId) {
            const result = await this.ss.listPlaylistTracks(currentPlaylistId);
            if (result.isError) {
                return;
            }

            const tracks = result.val as ITrack[];
        
            this.tracks(_.map(tracks, (item, index) => new TrackViewModelItem({ track: item } as any, index)));
        } else {
            this.tracks([]);
        }
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

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }
}

export { PlaylistsViewModel };
