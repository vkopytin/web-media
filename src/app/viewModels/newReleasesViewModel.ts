import * as _ from 'underscore';
import { IAlbum, IResponseResult, ITrack } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, current, State } from '../utils';
import { AlbumViewModelItem } from './albumViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { SpotifyService } from '../service/spotify';
import { BehaviorSubject } from 'rxjs';
import { ServiceResult } from '../base/serviceResult';


class NewReleasesViewModel extends ViewModel {
    errors$: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as ServiceResult<any, Error>[];

    newReleases$: BehaviorSubject<NewReleasesViewModel['newReleases']>;
    @State newReleases = [] as AlbumViewModelItem[];

    currentAlbum$: BehaviorSubject<NewReleasesViewModel['currentAlbum']>;
    @State currentAlbum = null as AlbumViewModelItem;

    tracks$: BehaviorSubject<NewReleasesViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    likedAlbums$: BehaviorSubject<NewReleasesViewModel['likedAlbums']>;
    @State likedAlbums = [] as AlbumViewModelItem[];

    settings = {
        ...(this as ViewModel).settings,
        releases: [] as AlbumViewModelItem[],
        myAlbums: [] as AlbumViewModelItem[]
    };

    selectAlbumCommand$: BehaviorSubject<NewReleasesViewModel['selectAlbumCommand']>;
    @State selectAlbumCommand = { exec: (album: AlbumViewModelItem) => this.currentAlbum = album };

    likeAlbumCommand$: BehaviorSubject<NewReleasesViewModel['likeAlbumCommand']>;
    @State likeAlbumCommand = { exec: (album: AlbumViewModelItem) => this.likeAlbum(album) };

    unlikeAlbumCommand$: BehaviorSubject<NewReleasesViewModel['unlikeAlbumCommand']>;
    @State unlikeAlbumCommand = { exec: (album: AlbumViewModelItem) => this.unlikeAlbum(album) };

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        _.delay(() => this.connect());
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (spotifyResult.isError) {
            this.errors = [spotifyResult];
        }
        if (assertNoErrors(spotifyResult, e => this.errors = e)) {
            return;
        }
        spotifyResult.val.on('change:state', state => this.checkAlbums());
        this.currentAlbum$.subscribe(() => _.delay(() => this.loadTracks()));
    }

    async fetchData() {
        const res = await this.ss.newReleases();
        if (assertNoErrors(res, e => this.errors = e)) {
            return;
        }
        const recomendations = res.val as IResponseResult<IAlbum>;

        this.newReleases = _.map(recomendations.items, album => new AlbumViewModelItem(album));

        this.checkAlbums();
    }

    async loadTracks() {
        const currentAlbum = this.currentAlbum;
        if (currentAlbum) {
            const result = await this.ss.listAlbumTracks(currentAlbum.id());
            if (assertNoErrors(result, e => this.errors = e)) {
                return;
            }

            const tracks = result.val as IResponseResult<ITrack>;
        
            this.tracks = _.map(tracks.items, (item, index) => new TrackViewModelItem({
                track: {
                    ...item,
                    album: item.album || currentAlbum.album
                },
                added_at: ''
            }, index));
        } else {
            this.tracks = [];
        }
    }

    async checkAlbums() {
        const albums = this.newReleases;
        const ids = _.map(albums, (album: AlbumViewModelItem) => album.id());
        const likedResult = await this.ss.hasAlbums(ids);
        if (assertNoErrors(likedResult, e => this.errors = e)) {

            return;
        }

        const likedAlbums = [];
        _.each(likedResult.val as boolean[], (liked, index) => {
            albums[index].isLiked(liked);
            liked && likedAlbums.push(albums[index]);
        });
        this.likedAlbums = likedAlbums;
    }

    async likeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.addAlbums(album.id());
        if (assertNoErrors(likedResult, e => this.errors = e)) {
            return;
        }
    }

    async unlikeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.removeAlbums(album.id());
        if (assertNoErrors(likedResult, e => this.errors = e)) {
            return;
        }
    }
}

export { NewReleasesViewModel };

