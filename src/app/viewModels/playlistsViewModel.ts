import { Events } from 'databindjs';
import { Service } from '../service';
import * as _ from 'underscore';
import { IUserPlaylistsResult } from '../service/adapter/spotify';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { current } from '../utils';


class PlaylistsViewModel extends Events {

    settings = {
        openLogin: false,
        currentPlaylist: null as PlaylistsViewModelItem
    };

    selectPlaylistCommand = {
        exec: (playlist: PlaylistsViewModelItem) => {
            this.currentPlaylist(playlist);
        }
    }

    playlistsArray = [] as PlaylistsViewModelItem[];
    tracksArray = [] as TrackViewModelItem[];

    isInit = _.delay(() => this.loadData());

    constructor(private ss = current(Service)) {
        super();
    }

    async loadData() {
        const result = await this.ss.myPlaylists();
        if (result.isError) {
            return result;
        }

        const playlists = result.val as IUserPlaylistsResult;

        this.playlists(_.map(playlists.items, item => new PlaylistsViewModelItem(item)));
    }

    async loadTracks() {
        const currentPlaylist = this.currentPlaylist();
        if (currentPlaylist) {
            const result = await this.ss.listPlaylistTracks(currentPlaylist.id());
            if (result.isError) {
                return;
            }

            const tracks = result.val;
        
            this.tracks(_.map(tracks.items, (item, index) => new TrackViewModelItem(item as any, index)));
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

    currentPlaylist(val?: PlaylistsViewModelItem) {
        if (arguments.length && this.settings.currentPlaylist !== val) {
            this.settings.currentPlaylist = val;
            this.trigger('change:currentPlaylist');
            _.delay(() => this.loadTracks());
        }

        return this.settings.currentPlaylist;
    }

}

export { PlaylistsViewModel };
