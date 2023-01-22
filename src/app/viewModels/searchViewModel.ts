import * as _ from 'underscore';
import { SettingsService } from '../service/settings';
import { MediaService } from '../service/mediaService';
import { asyncDebounce, asyncQueue, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { ArtistViewModelItem } from './artistViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { ISearchType, ISpotifySong } from '../ports/iMediaProt';


const searchQueue = asyncQueue();

class SearchViewModel {
    settings = {
        offset: 0,
        total: 0,
        limit: 20,
        currentMediaUri: null as string | null,
    };

    @State errors: Result[] = [];
    @State term = '';
    @State isLoading = false;
    @State tracks: TrackViewModelItem[] = [];
    @State artists: ArtistViewModelItem[] = [];
    @State albums: AlbumViewModelItem[] = [];
    @State playlists: PlaylistsViewModelItem[] = [];
    @State searchType: ISearchType = 'track';
    @State currentArtist: ArtistViewModelItem | null = null;
    @State currentAlbum: AlbumViewModelItem | null = null;
    @State currentPlaylist: PlaylistsViewModelItem | null = null;
    @State currentTracks: TrackViewModelItem[] = [];
    @State selectedItem: TrackViewModelItem | null = null;

    @State searchCommand = Scheduler.Command((term: string) => this.onChangeTerm(term));
    @State chageSearchTypeCommand = Scheduler.Command((searchType: ISearchType) => this.changeSearchType(searchType));
    @State selectAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.selectAlbum(album));
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => this.selectPlaylist(playlist));
    @State selectArtistCommand = Scheduler.Command((artist: ArtistViewModelItem) => this.selectArtist(artist));
    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());
    @State likeTrackCommand = Scheduler.Command(() => { throw new Error('not implemented') });
    @State unlikeTrackCommand = Scheduler.Command(() => { throw new Error('not implemented') });

    onChangeTerm = asyncDebounce((term: string) => {
        searchQueue.push(async (next) => {
            try {
                this.term = term;
                this.settingsService.set('lastSearch', { val: this.term });
                if (this.term) {
                    await this.fetchData();
                } else {
                    this.tracks = [];
                }
            } finally {
                next();
            }
        });
    }, 300);

    constructor(private media: MediaService, private settingsService: SettingsService) {

    }

    async init(): Promise<void> {
        this.settings = {
            offset: 0,
            total: 0,
            limit: 20,
            currentMediaUri: null as string | null,
        };
        this.settingsService.get('lastSearch').map(({ val }) => {
            this.term = val;
        });
        await this.fetchData();
    }

    changeSearchType(searchType: ISearchType): void {
        this.searchType = searchType;
        this.fetchData();
    }

    selectAlbum(album: AlbumViewModelItem | null): void {
        this.currentAlbum = album;
        this.fetchTracks();
    }

    selectPlaylist(playlist: PlaylistsViewModelItem | null): void {
        this.currentPlaylist = playlist;
        this.fetchTracks();
    }

    selectArtist(artist: ArtistViewModelItem | null): void {
        this.currentArtist = artist;
        this.fetchTracks();
    }

    async fetchData(): Promise<void> {
        this.isLoading = true;
        this.tracks = [];
        this.artists = [];
        this.albums = [];
        this.playlists = [];
        this.settings.offset = 0;
        if (!this.term) {
            this.isLoading = false;
            return;
        }
        const res = await this.media.search(this.searchType, this.term, this.settings.offset, this.settings.limit);
        res.map(search => {
            if ('tracks' in search && search.tracks) {
                this.settings.total = search.tracks.total || 0;
                this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);

                this.tracks = _.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index));
            } else if ('artists' in search && search.artists) {
                this.settings.total = search.artists.total;
                this.settings.offset = search.artists.offset + Math.min(this.settings.limit, search.artists.items.length);

                this.artists = _.map(search.artists.items, (artist, index) => new ArtistViewModelItem(artist, index));
            } else if ('albums' in search && search.albums) {
                this.settings.total = search.albums.total;
                this.settings.offset = search.albums.offset + Math.min(this.settings.limit, search.albums.items.length);

                this.albums = _.map(search.albums.items, (album) => new AlbumViewModelItem(album));
            } else if ('playlists' in search && search.playlists) {
                this.settings.total = search.playlists.total;
                this.settings.offset = search.playlists.offset + Math.min(this.settings.limit, search.playlists.items.length);

                this.playlists = _.map(search.playlists.items, (playlist) => new PlaylistsViewModelItem(playlist));
            }
        }).error(e => this.errors = [Result.error(e)]);
        this.isLoading = false;
    }

    async loadMore(): Promise<void> {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading = true;
        const res = await this.media.search(this.searchType, this.term, this.settings.offset, this.settings.limit);
        res.map(search => {
            if (search?.tracks) {
                this.tracksAddRange(_.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, (search.tracks?.offset || 0) + index)));

                this.settings.total = search.tracks.total;
                this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);
            } else if (search?.artists) {
                this.artistsAddRange(_.map(search.artists.items, (artist, index) => new ArtistViewModelItem(artist, (search.artists?.offset || 0) + index)));

                this.settings.total = search.artists.total;
                this.settings.offset = search.artists.offset + Math.min(this.settings.limit, search.artists.items.length);
            } else if (search?.albums) {
                this.albumsAddRange(_.map(search.albums.items, (album) => new AlbumViewModelItem(album)));

                this.settings.total = search.albums.total;
                this.settings.offset = search.albums.offset + Math.min(this.settings.limit, search.albums.items.length);
            } else if (search?.playlists) {
                this.playlistsAddRange(_.map(search.playlists.items, (artist) => new PlaylistsViewModelItem(artist)));

                this.settings.total = search.playlists.total;
                this.settings.offset = search.playlists.offset + Math.min(this.settings.limit, search.playlists.items.length);
            }
        });
        this.isLoading = false;
    }

    async fetchTracks(): Promise<void> {
        this.currentTracks = [];

        if (this.searchType === 'album' && this.currentAlbum) {
            const albumTrackssResult = await this.media.listAlbumTracks(this.currentAlbum.id());

            albumTrackssResult
                .map(tr => this.currentTracks = _.map(tr.items, (item, index) => new TrackViewModelItem({ track: item } as ISpotifySong, index)))
                .error(e => this.errors = [Result.error(e)]);
        }

        if (this.searchType === 'playlist' && this.currentPlaylist) {
            const playlistTracksResult = await this.media.fetchPlaylistTracks(this.currentPlaylist.id());

            playlistTracksResult
                .map(tr => this.currentTracks = _.map(tr.items, (item, index) => new TrackViewModelItem(item, index)))
                .error(e => this.errors = [Result.error(e)]);
        }

        if (this.searchType === 'artist' && this.currentArtist) {
            const artistTracksResult = await this.media.fetchArtistTopTracks(this.currentArtist.id(), 'US');

            artistTracksResult
                .map(tr => this.currentTracks = _.map(tr.tracks, (item, index) => new TrackViewModelItem({ track: item } as ISpotifySong, index)))
                .error(e => this.errors = [Result.error(e)]);
        }
    }

    tracksAddRange(value: TrackViewModelItem[]): void {
        const array = [...this.tracks, ...value];
        this.tracks = array;
    }

    artistsAddRange(value: ArtistViewModelItem[]): void {
        const array = [...this.artists, ...value];
        this.artists = array;
    }

    albumsAddRange(value: AlbumViewModelItem[]): void {
        const array = [...this.albums, ...value];
        this.albums = array;
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]): void {
        const array = [...this.playlists, ...value];
        this.playlists = array;
    }

    playInTracks(item: TrackViewModelItem): Promise<void> {
        return item.playTracks(this.tracks);
    }
}

export { SearchViewModel };

