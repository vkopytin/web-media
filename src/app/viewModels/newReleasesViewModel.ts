import { LogService } from '../service';
import * as _ from 'underscore';
import { MediaService } from '../service/mediaService';
import { Binding, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class NewReleasesViewModel {
    @State newReleases: AlbumViewModelItem[] = [];
    @State featuredPlaylists: PlaylistsViewModelItem[] = [];
    @State currentAlbum: AlbumViewModelItem | null = null;
    @State currentPlaylist: PlaylistsViewModelItem | null = null;
    @State currentTracks: TrackViewModelItem[] = [];
    @State tracks: TrackViewModelItem[] = [];
    @State likedAlbums: AlbumViewModelItem[] = [];

    @State selectAlbumCommand = Scheduler.Command((album: AlbumViewModelItem | null) => {
        this.currentPlaylist = null;
        this.currentAlbum = album;
        this.loadTracks();
    });
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem | null) => {
        this.currentAlbum = null;
        this.currentPlaylist = playlist;
        this.loadTracks();
    });
    @State likeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.likeAlbum(album));
    @State unlikeAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.unlikeAlbum(album));

    @Binding((v: NewReleasesViewModel) => v.logService, 'errors')
    errors!: Result[];

    constructor(
        private logService: LogService,
        private media: MediaService,
    ) {

    }

    async init(): Promise<void> {
        await this.connect();
        await this.fetchData();
    }

    async connect(): Promise<void> {
        this.media.on('change:state', () => this.checkAlbums());
    }

    async fetchData(): Promise<void> {
        const res = await this.media.newReleases();
        const res2 = await res.map(releases => {
            this.newReleases = _.map(releases.albums?.items || [], album => AlbumViewModelItem.fromAlbum(album));
            this.checkAlbums();
        }).cata(() => this.media.featuredPlaylists());
        const res3 = res2.map(featuredPlaylists => {
            this.featuredPlaylists = _.map(featuredPlaylists.playlists?.items || [], playlist => PlaylistsViewModelItem.fromPlaylist(playlist));
        });
        res3.error(this.logService.logError);
    }

    async loadTracks(): Promise<void> {
        const currentAlbum = this.currentAlbum;
        if (currentAlbum) {
            const result = await this.media.listAlbumTracks(currentAlbum.id());
            result.map(tracks => {
                this.tracks = _.map(tracks.items, (item, index) => TrackViewModelItem.fromTrack({
                    ...item,
                    album: item.album || currentAlbum.album
                }, index));
            }).error(this.logService.logError);
        } else if (this.currentPlaylist) {
            const playlistTracksResult = await this.media.fetchPlaylistTracks(this.currentPlaylist.id(), 0, 100);
            playlistTracksResult.map(tracksResult => {
                const tracksModels = tracksResult.items.map((item, index) => TrackViewModelItem.fromSong(item, index));
                this.currentTracks = tracksModels;
            }).error(this.logService.logError);
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

        const likedResult = await this.media.hasAlbums(ids);
        likedResult.map(liked => {
            const likedAlbums = [] as AlbumViewModelItem[];
            _.each(liked, (liked, index) => {
                albums[index].isLiked = liked;
                liked && likedAlbums.push(albums[index]);
            });
            this.likedAlbums = likedAlbums;
        }).error(this.logService.logError);
    }

    async likeAlbum(album: AlbumViewModelItem): Promise<void> {
        const likedResult = await this.media.addAlbums(album.id());
        likedResult.error(this.logService.logError);
    }

    async unlikeAlbum(album: AlbumViewModelItem): Promise<void> {
        const likedResult = await this.media.removeAlbums(album.id());
        likedResult.error(this.logService.logError);
    }
}

export { NewReleasesViewModel };

