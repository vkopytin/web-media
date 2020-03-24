import * as _ from 'underscore';
import { IAlbum, IResponseResult, ITrack } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, current } from '../utils';
import { AlbumViewModelItem } from './albumViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { SpotifyService } from '../service/spotify';


class NewReleasesViewModel extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
        currentAlbum: null as AlbumViewModelItem,
        releases: [] as AlbumViewModelItem[],
        tracks: [] as TrackViewModelItem[],
        myAlbums: [] as AlbumViewModelItem[]
    };

    selectAlbumCommand = { exec: (album: AlbumViewModelItem) => this.currentAlbum(album) };
    likeAlbumCommand = { exec: (album: AlbumViewModelItem) => this.likeAlbum(album) };
    unlikeAlbumCommand = { exec: (album: AlbumViewModelItem) => this.unlikeAlbum(album) };

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        _.delay(() => this.connect());
    }

    newReleases(val?: AlbumViewModelItem[]) {
        if (arguments.length && val !== this.settings.releases) {
            this.settings.releases = val;
            this.trigger('change:newReleases');
        }

        return this.settings.releases;
    }

    currentAlbum(val?: AlbumViewModelItem) {
        if (arguments.length && this.settings.currentAlbum !== val) {
            this.settings.currentAlbum = val;
            this.trigger('change:currentAlbum');
            _.delay(() => this.loadTracks());
        }

        return this.settings.currentAlbum;
    }

    tracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.settings.tracks !== val) {
            this.settings.tracks = val;
            this.trigger('change:tracks');
        }

        return this.settings.tracks;
    }

    likedAlbums(val?: AlbumViewModelItem[]) {
        if (arguments.length && this.settings.myAlbums !== val) {
            this.settings.myAlbums = val;
            this.trigger('change:likedAlbums');
        }

        return this.settings.myAlbums;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (spotifyResult.isError) {
            this.errors([spotifyResult]);
        }
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        spotifyResult.val.on('change:state', state => this.checkAlbums());
    }

    async fetchData() {
        const res = await this.ss.newReleases();
        if (assertNoErrors(res, e => this.errors(e))) {
            return;
        }
        const recomendations = res.val as IResponseResult<IAlbum>;

        this.newReleases(_.map(recomendations.items, album => new AlbumViewModelItem(album)));

        this.checkAlbums();
    }

    async loadTracks() {
        const currentAlbum = this.currentAlbum();
        if (currentAlbum) {
            const result = await this.ss.listAlbumTracks(currentAlbum.id());
            if (assertNoErrors(result, e => this.errors(e))) {
                return;
            }

            const tracks = result.val as IResponseResult<ITrack>;
        
            this.tracks(_.map(tracks.items, (item, index) => new TrackViewModelItem({
                track: {
                    ...item,
                    album: item.album || currentAlbum.album
                },
                added_at: ''
            }, index)));
        } else {
            this.tracks([]);
        }
    }

    async checkAlbums() {
        const albums = this.newReleases();
        const ids = _.map(albums, (album: AlbumViewModelItem) => album.id());
        const likedResult = await this.ss.hasAlbums(ids);
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
        const likedAlbums = [];
        _.each(likedResult.val as boolean[], (liked, index) => {
            albums[index].isLiked(liked);
            liked && likedAlbums.push(albums[index]);
        });
        this.likedAlbums(likedAlbums);
    }

    async likeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.addAlbums(album.id());
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
    }

    async unlikeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.removeAlbums(album.id());
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
    }
}

export { NewReleasesViewModel };

