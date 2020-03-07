import { ViewModel } from '../base/viewModel';
import { Service, SpotifyService } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { IResponseResult, IAlbum, ITrack } from '../adapter/spotify';
import { AlbumViewModelItem } from './albumViewModelItem';
import { current, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';


class NewReleasesViewModel extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
        currentAlbum: null as AlbumViewModelItem
    };

    releasesArray = [] as AlbumViewModelItem[];
    tracksArray = [] as TrackViewModelItem[];
    myAlbumsArray = [] as AlbumViewModelItem[];

    selectAlbumCommand = {
        exec: (album: AlbumViewModelItem) => {
            this.currentAlbum(album);
        }
    };

    likeAlbumCommand = {
        exec: (album: AlbumViewModelItem) => this.likeAlbum(album)
    };

    unlikeAlbumCommand = {
        exec: (album: AlbumViewModelItem) => this.unlikeAlbum(album)
    };

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        _.delay(() => this.connect());
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
        const ids = _.map(albums, album => album.id());
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

    newReleases(value?: AlbumViewModelItem[]) {
        if (arguments.length && value !== this.releasesArray) {
            this.releasesArray = value;
            this.trigger('change:newReleases');
        }

        return this.releasesArray;
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
        if (arguments.length && this.tracksArray !== val) {
            this.tracksArray = val;
            this.trigger('change:tracks');
        }

        return this.tracksArray;
    }

    likedAlbums(val?: AlbumViewModelItem[]) {
        if (arguments.length && this.myAlbumsArray !== val) {
            this.myAlbumsArray = val;
            this.trigger('change:likedAlbums');
        }

        return this.myAlbumsArray;
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
