import * as _ from 'underscore';
import { IArtist } from '../adapter/spotify';
import { SpotifyService } from '../service/spotify';
import { State } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class ArtistViewModelItem {
    @State errors: Result[] = [];
    @State playlists: PlaylistsViewModelItem[] = [];
    @State isLiked = false;

    isInit = _.delay(() => {
        this.connect();
        this.loadData('playlistTracks');
    });

    constructor(public artist: IArtist, private index: number,
        private appViewModel = inject(AppViewModel),
        private spotifyService = inject(SpotifyService),
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
        res.error(e => this.errors = [Result.error(e)]);
    }

    async playTracks() {
        const device = this.appViewModel.currentDevice;
        const playResult = await this.spotifyService.play(device?.id(), this.uri());
        playResult.error(e => this.errors = [Result.error(e)]);
    }
}

export { ArtistViewModelItem };

