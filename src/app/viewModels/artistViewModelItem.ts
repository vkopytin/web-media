import { ViewModel } from '../base/viewModel';
import { formatTime, assertNoErrors } from '../utils';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { ISpotifySong, IUserPlaylist, ITrack, IArtist } from '../adapter/spotify';
import { current } from '../utils';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class ArtistViewModelItem extends ViewModel {
    appViewModel = current(AppViewModel);
    settings = {
        ...(this as ViewModel).settings,
        isLiked: false
    };

    isInit = _.delay(() => {
        this.connect();
        this.loadData('playlistTracks');
    });

    constructor(public artist: IArtist, private index: number, private ss = current(Service)) {
        super();
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        const spotify = spotifyResult.val;
    }

    async loadData(...args) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    id() {
        return this.artist.id;
    }

    name() {
        return this.artist.name;
    }

    uri() {
        return this.artist.uri;
    }

    thumbnailUrl() {
        const image = _.last(this.artist.images);
        return image?.url;
    }

    async play() {
        const device = this.appViewModel.currentDevice();

        this.ss.play(device?.id(), this.uri());
    }

    async playTracks() {
        const device = this.appViewModel.currentDevice();
        const playResult = this.ss.play(device?.id(), this.uri());
        assertNoErrors(playResult, e => this.errors(e));
    }

    playlists(val?: PlaylistsViewModelItem[]) {
        if (arguments.length && this.settings.playlists !== val) {
            this.settings.playlists = val;
            this.trigger('change:playlists');
        }

        return this.settings.playlists;
    }

    isLiked(val?) {
        if (arguments.length && val !== this.settings.isLiked) {
            this.settings.isLiked = val;
            this.trigger('change:isLiked');
        }

        return this.settings.isLiked;
    }
}

export { ArtistViewModelItem };
