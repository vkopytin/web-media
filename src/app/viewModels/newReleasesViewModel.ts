import * as _ from 'underscore';
import { IAlbum, IResponseResult, ISearchResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, State, ValueContainer } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class NewReleasesViewModel {
    errors$: ValueContainer<ServiceResult<any, Error>[], NewReleasesViewModel>;
    @State errors = [] as ServiceResult<any, Error>[];

    newReleases$: ValueContainer<NewReleasesViewModel['newReleases'], NewReleasesViewModel>;
    @State newReleases = [] as AlbumViewModelItem[];

    featuredPlaylists$: ValueContainer<NewReleasesViewModel['featuredPlaylists'], NewReleasesViewModel>;
    @State featuredPlaylists = [] as PlaylistsViewModelItem[];

    currentAlbum$: ValueContainer<NewReleasesViewModel['currentAlbum'], NewReleasesViewModel>;
    @State currentAlbum = null as AlbumViewModelItem;

    currentPlaylist$: ValueContainer<NewReleasesViewModel['currentPlaylist'], NewReleasesViewModel>;
    @State currentPlaylist = null as PlaylistsViewModelItem;

    currentTracks$: ValueContainer<NewReleasesViewModel['currentTracks'], NewReleasesViewModel>;
    @State currentTracks = [] as TrackViewModelItem[];

    tracks$: ValueContainer<NewReleasesViewModel['tracks'], NewReleasesViewModel>;
    @State tracks = [] as TrackViewModelItem[];

    likedAlbums$: ValueContainer<NewReleasesViewModel['likedAlbums'], NewReleasesViewModel>;
    @State likedAlbums = [] as AlbumViewModelItem[];

    selectAlbumCommand$: ValueContainer<NewReleasesViewModel['selectAlbumCommand'], NewReleasesViewModel>;
    @State selectAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => {
        this.currentPlaylist = null;
        this.currentAlbum = album;
        this.loadTracks();
    });

    selectPlaylistCommand$: ValueContainer<NewReleasesViewModel['selectPlaylistCommand'], NewReleasesViewModel>;
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => {
        this.currentAlbum = null;
        this.currentPlaylist = playlist;
        this.loadTracks();
    });

    likeAlbumCommand$: ValueContainer<NewReleasesViewModel['likeAlbumCommand'], NewReleasesViewModel>;
    @State likeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.likeAlbum(album));

    unlikeAlbumCommand$: ValueContainer<NewReleasesViewModel['unlikeAlbumCommand'], NewReleasesViewModel>;
    @State unlikeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.unlikeAlbum(album));

    isInit = new Promise(resume => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        resume(true);
    }));

    constructor(private ss = current(Service)) {

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
        this.currentAlbum$.subscribe(() => _.delay(() => this.loadTracks()), this);
        this.currentPlaylist$.subscribe(() => _.delay(() => this.loadTracks()), this);
    }

    async fetchData() {
        const res = await this.ss.newReleases();
        if (assertNoErrors(res, e => this.errors = e)) {

            return;
        }

        const releases = res.val as IResponseResult<IAlbum>;
        this.newReleases = _.map(releases.items, album => new AlbumViewModelItem(album));
        this.checkAlbums();

        const featuredPlaylistsResult = await this.ss.featuredPlaylists();
        if (assertNoErrors(res, e => this.errors = e)) {

            return;
        }
        const featuredPlaylists = featuredPlaylistsResult.val as ISearchResult;
        this.featuredPlaylists = _.map(featuredPlaylists.playlists.items, playlist => new PlaylistsViewModelItem(playlist));
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
        } else if (this.currentPlaylist) {
            const playlistTracksResult = await this.ss.fetchPlaylistTracks(this.currentPlaylist.id(), 0, 100);
            if (assertNoErrors(playlistTracksResult, e => this.errors = e)) {
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
        if (assertNoErrors(likedResult, e => this.errors = e)) {

            return;
        }

        const likedAlbums = [];
        _.each(likedResult.val as boolean[], (liked, index) => {
            albums[index].isLiked = liked;
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

