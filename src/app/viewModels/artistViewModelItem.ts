import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IArtist } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, State } from '../utils';
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
        const image = _.last(this.artist.images);
        return image?.url;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors = e)) {
            return;
        }
        const spotify = spotifyResult.val;
    }

    async loadData(...args) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async play() {
        const device = this.appViewModel.currentDevice;

        this.ss.play(device?.id(), this.uri());
    }

    async playTracks() {
        const device = this.appViewModel.currentDevice;
        const playResult = this.ss.play(device?.id(), this.uri());
        assertNoErrors(playResult, e => this.errors = e);
    }
}

export { ArtistViewModelItem };

