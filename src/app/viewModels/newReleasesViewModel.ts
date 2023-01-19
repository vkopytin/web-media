import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IResponseResult, ISearchResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class NewReleasesViewModel {
    errors$!: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as Result<Error, unknown>[];

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

    constructor(
        private spotifyService: SpotifyService,
        private ss: Service,
    ) {

    }

    async init() {
        await this.connect();
        await this.fetchData();
    }

    async connect() {
        this.spotifyService.on('change:state', () => this.checkAlbums());
    }

    async fetchData() {
        const res = await this.ss.newReleases();
        const res2 = await res.map(releases => {
            this.newReleases = _.map(releases.albums?.items || [], album => new AlbumViewModelItem(album));
            this.checkAlbums();
        }).cata(() => this.ss.featuredPlaylists());
        const res3 = res2.map(featuredPlaylists => {
            this.featuredPlaylists = _.map(featuredPlaylists.playlists?.items || [], playlist => new PlaylistsViewModelItem(playlist));
        });
        res3.error(e => this.errors = [Result.error(e)]);
    }

    async loadTracks() {
        const currentAlbum = this.currentAlbum;
        if (currentAlbum) {
            const result = await this.ss.listAlbumTracks(currentAlbum.id());
            result.map(tracks => {
                this.tracks = _.map(tracks.items, (item, index) => new TrackViewModelItem({
                    track: {
                        ...item,
                        album: item.album || currentAlbum.album
                    },
                    added_at: ''
                }, index));
            }).error(e => this.errors = [Result.error(e)]);
        } else if (this.currentPlaylist) {
            const playlistTracksResult = await this.ss.fetchPlaylistTracks(this.currentPlaylist.id(), 0, 100);
            playlistTracksResult.map(tracksResult => {
                const tracksModels = _.map(tracksResult.items, (item, index) => new TrackViewModelItem(item, index));
                this.currentTracks = tracksModels;
            }).error(e => this.errors = [Result.error(e)]);
        } else {
            this.tracks = [];
        }
    }

    async checkAlbums() {
        const albums = this.newReleases;
        const ids = _.map(albums, (album: AlbumViewModelItem) => album.id());
        if (ids.length === 0) {
            return;
        }

        const likedResult = await this.ss.hasAlbums(ids);
        likedResult.map(liked => {
            const likedAlbums = [] as AlbumViewModelItem[];
            _.each(liked, (liked, index) => {
                albums[index].isLiked = liked;
                liked && likedAlbums.push(albums[index]);
            });
            this.likedAlbums = likedAlbums;
        }).error(e => this.errors = [Result.error(e)]);
    }

    async likeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.addAlbums(album.id());
        likedResult.error(() => this.errors = [likedResult]);
    }

    async unlikeAlbum(album: AlbumViewModelItem) {
        const likedResult = await this.ss.removeAlbums(album.id());
        likedResult.error(() => this.errors = [likedResult]);
    }
}

export { NewReleasesViewModel };

