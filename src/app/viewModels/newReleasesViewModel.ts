import * as _ from 'underscore';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class NewReleasesViewModel {
    @State errors: Result[] = [];
    @State newReleases: AlbumViewModelItem[] = [];
    @State featuredPlaylists: PlaylistsViewModelItem[] = [];
    @State currentAlbum: AlbumViewModelItem | null = null;
    @State currentPlaylist: PlaylistsViewModelItem | null = null;
    @State currentTracks: TrackViewModelItem[] = [];
    @State tracks: TrackViewModelItem[] = [];
    @State likedAlbums: AlbumViewModelItem[] = [];

    @State selectAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => {
        this.currentPlaylist = null;
        this.currentAlbum = album;
        this.loadTracks();
    });
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => {
        this.currentAlbum = null;
        this.currentPlaylist = playlist;
        this.loadTracks();
    });
    @State likeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.likeAlbum(album));
    @State unlikeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.unlikeAlbum(album));

    constructor(
        private spotify: SpotifyService,
        private ss: Service,
    ) {

    }

    async init(): Promise<void> {
        await this.connect();
        await this.fetchData();
    }

    async connect(): Promise<void> {
        this.spotify.on('change:state', () => this.checkAlbums());
    }

    async fetchData(): Promise<void> {
        const res = await this.spotify.newReleases();
        const res2 = await res.map(releases => {
            this.newReleases = _.map(releases.albums?.items || [], album => new AlbumViewModelItem(album));
            this.checkAlbums();
        }).cata(() => this.spotify.featuredPlaylists());
        const res3 = res2.map(featuredPlaylists => {
            this.featuredPlaylists = _.map(featuredPlaylists.playlists?.items || [], playlist => new PlaylistsViewModelItem(playlist));
        });
        res3.error(e => this.errors = [Result.error(e)]);
    }

    async loadTracks(): Promise<void> {
        const currentAlbum = this.currentAlbum;
        if (currentAlbum) {
            const result = await this.spotify.listAlbumTracks(currentAlbum.id());
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
            const playlistTracksResult = await this.spotify.fetchPlaylistTracks(this.currentPlaylist.id(), 0, 100);
            playlistTracksResult.map(tracksResult => {
                const tracksModels = _.map(tracksResult.items, (item, index) => new TrackViewModelItem(item, index));
                this.currentTracks = tracksModels;
            }).error(e => this.errors = [Result.error(e)]);
        } else {
            this.tracks = [];
        }
    }

    async checkAlbums(): Promise<void> {
        const albums = this.newReleases;
        const ids = _.map(albums, (album: AlbumViewModelItem) => album.id());
        if (ids.length === 0) {
            return;
        }

        const likedResult = await this.spotify.hasAlbums(ids);
        likedResult.map(liked => {
            const likedAlbums = [] as AlbumViewModelItem[];
            _.each(liked, (liked, index) => {
                albums[index].isLiked = liked;
                liked && likedAlbums.push(albums[index]);
            });
            this.likedAlbums = likedAlbums;
        }).error(e => this.errors = [Result.error(e)]);
    }

    async likeAlbum(album: AlbumViewModelItem): Promise<void> {
        const likedResult = await this.spotify.addAlbums(album.id());
        likedResult.error(() => this.errors = [likedResult]);
    }

    async unlikeAlbum(album: AlbumViewModelItem): Promise<void> {
        const likedResult = await this.spotify.removeAlbums(album.id());
        likedResult.error(() => this.errors = [likedResult]);
    }
}

export { NewReleasesViewModel };

