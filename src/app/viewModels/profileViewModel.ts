import { Events } from 'databindjs';
import { Service } from '../service';
import * as _ from 'underscore';
import { IUserPlaylistsResult } from '../service/adapter/spotify';
import { PlaylistViewModelItem } from './playlistViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class ProfileViewModel extends Events {

    settings = {
        openLogin: false,
        currentPlaylist: null as PlaylistViewModelItem
    };

    selectPlaylistCommand = {
        exec: (playlist: PlaylistViewModelItem) => {
            this.currentPlaylist(playlist);
        }
    }

    playlistsArray = [] as PlaylistViewModelItem[];
    tracksArray = [] as TrackViewModelItem[];

    isInit = _.delay(() => this.loadData());

    constructor(private ss = new Service()) {
        super();
    }

    async loadData() {
        const result = await this.ss.myPlaylists();
        if (result.isError) {
            return result;
        }

        const playlists = result.val as IUserPlaylistsResult;

        this.playlists(_.map(playlists.items, item => new PlaylistViewModelItem(item)));
    }

    async loadTracks() {
        const currentPlaylist = this.currentPlaylist();
        if (currentPlaylist) {
            const result = await this.ss.listTracks(currentPlaylist.id());
            if (result.isError) {
                return;
            }

            const tracks = result.val;
        
            this.tracks(_.map(tracks.items, item => new TrackViewModelItem(item as any)));
        } else {
            this.tracks([]);
        }
    }

    playlists(val?: PlaylistViewModelItem[]) {
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

    currentPlaylist(val?: PlaylistViewModelItem) {
        if (arguments.length && this.settings.currentPlaylist !== val) {
            this.settings.currentPlaylist = val;
            this.trigger('change:currentPlaylist');
            _.delay(() => this.loadTracks());
        }

        return this.settings.currentPlaylist;
    }

}

export { ProfileViewModel };
