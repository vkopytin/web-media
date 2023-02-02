import * as _ from 'underscore';
import { IArtist } from '../ports/iMediaProt';
import { RemotePlaybackService } from '../service/remotePlaybackService';
import { State } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class ArtistViewModelItem {
    static fromArtist(artist: IArtist, index: number): ArtistViewModelItem {
        const inst = new ArtistViewModelItem(artist, index);
        return inst;
    }
    @State errors: Result[] = [];
    @State playlists: PlaylistsViewModelItem[] = [];
    @State isLiked = false;

    isInit = _.delay(() => {
        this.loadData('playlistTracks');
    });

    constructor(public artist: IArtist, private index: number,
        private appViewModel = inject(AppViewModel),
        private remotePlayback = inject(RemotePlaybackService),
    ) {

    }

    id(): string {
        return this.artist.id;
    }

    name(): string {
        return this.artist.name;
    }

    uri(): string {
        return this.artist.uri;
    }

    thumbnailUrl(): string {
        const image = _.first(this.artist.images);
        return image?.url || '';
    }

    loadData(...args: unknown[]): void {
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
    }

    async play(): Promise<void> {
        const device = this.appViewModel.currentDevice;

        const res = await this.remotePlayback.play(device?.id(), this.uri());
        res.error(e => this.errors = [Result.error(e)]);
    }

    async playTracks(): Promise<void> {
        const device = this.appViewModel.currentDevice;
        const playResult = await this.remotePlayback.play(device?.id(), this.uri());
        playResult.error(e => this.errors = [Result.error(e)]);
    }
}

export { ArtistViewModelItem };

