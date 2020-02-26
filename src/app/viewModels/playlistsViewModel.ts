import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { IUserPlaylistsResult, IResponseResult, ISpotifySong, IUserPlaylist } from '../service/adapter/spotify';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { current, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';


class PlaylistsViewModel extends Events {

    settings = {
        errors: [] as ServiceResult<any, Error>[],
        openLogin: false,
        currentPlaylistId: ''
    };

    selectPlaylistCommand = {
        exec: (playlistId: string) => {
            this.currentPlaylistId(playlistId);
        }
    }

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
        spotify.on('change:state', () => this.loadData());
    }

    async fetchData() {
        const result = await this.ss.fetchMyPlaylists();
        if (result.isError) {
            return result;
        }
    }

    async loadData() {
        const result = await this.ss.myPlaylists();
        if (result.isError) {
            return result;
        }

        const playlists = result.val as IUserPlaylist[];

        this.playlists(_.map(playlists, item => new PlaylistsViewModelItem(item)));
    }

    async loadTracks() {
        const currentPlaylistId = this.currentPlaylistId();
        if (currentPlaylistId) {
            const result = await this.ss.listPlaylistTracks(currentPlaylistId);
            if (result.isError) {
                return;
            }

            const tracks = result.val as IResponseResult<ISpotifySong>;
        
            this.tracks(_.map(tracks.items, (item, index) => new TrackViewModelItem(item, index)));
        } else {
            this.tracks([]);
        }
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
            _.delay(() => this.loadTracks());
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
