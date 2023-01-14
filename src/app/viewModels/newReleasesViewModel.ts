import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IAlbum, IResponseResult, ISearchResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class NewReleasesViewModel {
    errors$!: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as ServiceResult<any, Error>[];

    newReleases$!: BehaviorSubject<NewReleasesViewModel['newReleases']>;
    @State newReleases = [] as AlbumViewModelItem[];

    featuredPlaylists$!: BehaviorSubject<NewReleasesViewModel['featuredPlaylists']>;
    @State featuredPlaylists = [] as PlaylistsViewModelItem[];

    currentAlbum$!: BehaviorSubject<NewReleasesViewModel['currentAlbum']>;
    @State currentAlbum: AlbumViewModelItem | null = null;

    currentPlaylist$!: BehaviorSubject<NewReleasesViewModel['currentPlaylist']>;
    @State currentPlaylist: PlaylistsViewModelItem | null = null;

    currentTracks$!: BehaviorSubject<NewReleasesViewModel['currentTracks']>;
    @State currentTracks = [] as TrackViewModelItem[];

    tracks$!: BehaviorSubject<NewReleasesViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    likedAlbums$!: BehaviorSubject<NewReleasesViewModel['likedAlbums']>;
    @State likedAlbums = [] as AlbumViewModelItem[];

    selectAlbumCommand$!: BehaviorSubject<NewReleasesViewModel['selectAlbumCommand']>;
    @State selectAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => {
        this.currentPlaylist = null;
        this.currentAlbum = album;
        this.loadTracks();
    });

    selectPlaylistCommand$!: BehaviorSubject<NewReleasesViewModel['selectPlaylistCommand']>;
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => {
        this.currentAlbum = null;
        this.currentPlaylist = playlist;
        this.loadTracks();
    });

    likeAlbumCommand$!: BehaviorSubject<NewReleasesViewModel['likeAlbumCommand']>;
    @State likeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.likeAlbum(album));

    unlikeAlbumCommand$!: BehaviorSubject<NewReleasesViewModel['unlikeAlbumCommand']>;
    @State unlikeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.unlikeAlbum(album));

    isInit = new Promise(resume => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        resume(true);
    }));

    constructor(private ss: Service) {

    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (spotifyResult.isError) {
            this.errors = [spotifyResult];
        }
        if (assertNoErrors(spotifyResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
            return;
        }
        spotifyResult.map(val => val.on('change:state', state => this.checkAlbums()));
        this.currentAlbum$.subscribe(() => _.delay(() => this.loadTracks()));
        this.currentPlaylist$.subscribe(() => _.delay(() => this.loadTracks()));
    }

    async fetchData() {
        const res = await this.ss.newReleases();
        if (assertNoErrors(res, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {

            return;
        }

        const releases = res.val as IResponseResult<IAlbum>;
        this.newReleases = _.map(releases.items, album => new AlbumViewModelItem(album));
        this.checkAlbums();

        const featuredPlaylistsResult = await this.ss.featuredPlaylists();
        if (assertNoErrors(res, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {

            return;
        }
        const featuredPlaylists = featuredPlaylistsResult.val as ISearchResult;
        this.featuredPlaylists = _.map(featuredPlaylists.playlists?.items || [], playlist => new PlaylistsViewModelItem(playlist));
    }

    async loadTracks() {
        const currentAlbum = this.currentAlbum;
        if (currentAlbum) {
            const result = await this.ss.listAlbumTracks(currentAlbum.id());
            if (assertNoErrors(result, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
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
        } else if (this.currentPlaylist) {
            const playlistTracksResult = await this.ss.fetchPlaylistTracks(this.currentPlaylist.id(), 0, 100);
            if (assertNoErrors(playlistTracksResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
                return;
            }
            const tracksResult = playlistTracksResult.val as IResponseResult<ISpotifySong>;
            const tracksModels = _.map(tracksResult.items, (item, index) => new TrackViewModelItem(item, index));
            this.currentTracks = tracksModels;
        } else {
            this.tracks = [];
        }
    }

    async checkAlbums() {
        const albums = this.newReleases;
        const ids = _.map(albums, (album: AlbumViewModelItem) => album.id());
        const likedResult = await this.ss.hasAlbums(ids);
        if (assertNoErrors(likedResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {

            return;
        }

        const likedAlbums = [] as AlbumViewModelItem[];
        _.each(likedResult.val as boolean[], (liked, index) => {
            albums[index].isLiked = liked;
            liked && likedAlbums.push(albums[index]);
        });
        this.likedAlbums = likedAlbums;
    }

    async likeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.addAlbums(album.id());
        if (assertNoErrors(likedResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
            return;
        }
    }

    async unlikeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.removeAlbums(album.id());
        if (assertNoErrors(likedResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
            return;
        }
    }
}

export { NewReleasesViewModel };

