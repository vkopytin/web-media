import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IArtist } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { current, State } from '../utils';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class ArtistViewModelItem {
    appViewModel = current(AppViewModel);

    errors$: BehaviorSubject<ArtistViewModelItem['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    playlists$: BehaviorSubject<ArtistViewModelItem['playlists']>;
    @State playlists = [] as PlaylistsViewModelItem[];

    isLiked$: BehaviorSubject<ArtistViewModelItem['playlists']>;
    @State isLiked = false;

    isInit = _.delay(() => {
        this.connect();
        this.loadData('playlistTracks');
    });

    constructor(public artist: IArtist, private index: number, private ss = current(Service)) {

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
        const image = _.first(this.artist.images);
        return image?.url;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        spotifyResult.assert(e => this.errors = [e]);
    }

    async loadData(...args) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async play() {
        const device = this.appViewModel.currentDevice;

        const res = await this.ss.play(device?.id(), this.uri());
        res.assert(e => this.errors = [e]);
    }

    async playTracks() {
        const device = this.appViewModel.currentDevice;
        const playResult = await this.ss.play(device?.id(), this.uri());
        playResult.assert(e => this.errors = [e]);
    }
}

export { ArtistViewModelItem };

