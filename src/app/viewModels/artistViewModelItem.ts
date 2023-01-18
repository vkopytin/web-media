import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IArtist } from '../adapter/spotify';
import { SpotifyService } from '../service/spotify';
import { current, State } from '../utils';
import { Result } from '../utils/result';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class ArtistViewModelItem {
    errors$!: BehaviorSubject<ArtistViewModelItem['errors']>;
    @State errors = [] as Result<Error, unknown>[];

    playlists$!: BehaviorSubject<ArtistViewModelItem['playlists']>;
    @State playlists = [] as PlaylistsViewModelItem[];

    isLiked$!: BehaviorSubject<ArtistViewModelItem['playlists']>;
    @State isLiked = false;

    isInit = _.delay(() => {
        this.connect();
        this.loadData('playlistTracks');
    });

    constructor(public artist: IArtist, private index: number,
        private appViewModel = current(AppViewModel),
        private spotifyService = current(SpotifyService),
    ) {

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

    }

    async loadData(...args: unknown[]) {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async play() {
        const device = this.appViewModel.currentDevice;

        const res = await this.spotifyService.play(device?.id(), this.uri());
        res.error(e => this.errors = [res]);
    }

    async playTracks() {
        const device = this.appViewModel.currentDevice;
        const playResult = await this.spotifyService.play(device?.id(), this.uri());
        playResult.error(e => this.errors = [playResult]);
    }
}

export { ArtistViewModelItem };

