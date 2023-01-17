import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { ISearchResult, ISearchType, ISpotifySong } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { asyncDebounce, asyncQueue, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AlbumViewModelItem } from './albumViewModelItem';
import { ArtistViewModelItem } from './artistViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


const searchQueue = asyncQueue();

class SearchViewModel {
    errors$!: BehaviorSubject<SearchViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    term$!: BehaviorSubject<SearchViewModel['term']>;
    @State term = '';

    @State isLoading = false;

    tracks$!: BehaviorSubject<SearchViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];
    artists$!: BehaviorSubject<SearchViewModel['artists']>;
    @State artists = [] as ArtistViewModelItem[];
    albums$!: BehaviorSubject<SearchViewModel['albums']>;
    @State albums = [] as AlbumViewModelItem[];
    playlists$!: BehaviorSubject<SearchViewModel['playlists']>;
    @State playlists = [] as PlaylistsViewModelItem[];
    searchType$!: BehaviorSubject<SearchViewModel['searchType']>;
    @State searchType: ISearchType = 'track';
    currentArtist$!: BehaviorSubject<SearchViewModel['currentArtist']>;
    @State currentArtist: ArtistViewModelItem | null = null;
    currentAlbum$!: BehaviorSubject<SearchViewModel['currentAlbum']>;
    @State currentAlbum: AlbumViewModelItem | null = null;
    currentPlaylist$!: BehaviorSubject<SearchViewModel['currentPlaylist']>;
    @State currentPlaylist: PlaylistsViewModelItem | null = null;
    currentTracks$!: BehaviorSubject<SearchViewModel['currentTracks']>;
    @State currentTracks = [] as TrackViewModelItem[];
    selectedItem$!: BehaviorSubject<SearchViewModel['selectedItem']>;
    @State selectedItem: TrackViewModelItem | null = null;

    settings = {
        offset: 0,
        total: 0,
        limit: 20,
        currentMediaUri: null as string | null,
    };

    searchCommand$!: BehaviorSubject<SearchViewModel['searchCommand']>;
    @State searchCommand = Scheduler.Command((term: string) => (this.term = term, this.onChangeTerm()));

    chageSearchTypeCommand$!: BehaviorSubject<SearchViewModel['chageSearchTypeCommand']>;
    @State chageSearchTypeCommand = Scheduler.Command((searchType: ISearchType) => this.changeSearchType(searchType));

    selectAlbumCommand$!: BehaviorSubject<SearchViewModel['selectAlbumCommand']>;
    @State selectAlbumCommand = Scheduler.Command((album: AlbumViewModelItem) => this.selectAlbum(album));

    selectPlaylistCommand$!: BehaviorSubject<SearchViewModel['selectPlaylistCommand']>;
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => this.selectPlaylist(playlist));

    selectArtistCommand$!: BehaviorSubject<SearchViewModel['selectArtistCommand']>;
    @State selectArtistCommand = Scheduler.Command((artist: ArtistViewModelItem) => this.selectArtist(artist));

    loadMoreCommand$!: BehaviorSubject<SearchViewModel['loadMoreCommand']>;
    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());

    likeTrackCommand$!: BehaviorSubject<SearchViewModel['likeTrackCommand']>;
    @State likeTrackCommand = Scheduler.Command(() => { });

    unlikeTrackCommand$!: BehaviorSubject<SearchViewModel['unlikeTrackCommand']>;
    @State unlikeTrackCommand = Scheduler.Command(() => { });

    onChangeTerm = asyncDebounce(() => {
        searchQueue.push(async (next) => {
            try {
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

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        this.fetchData();
        resolve(true);
    }, 100));

    constructor(private spotifyService: SpotifyService, private ss: Service) {

    }

    changeSearchType(searchType: ISearchType) {
        this.searchType = searchType;
        this.fetchData();
    };

    selectAlbum(album: AlbumViewModelItem | null) {
        this.currentAlbum = album;
        this.fetchTracks();
    }

    selectPlaylist(playlist: PlaylistsViewModelItem | null) {
        this.currentPlaylist = playlist;
        this.fetchTracks();
    }

    selectArtist(artist: ArtistViewModelItem | null) {
        this.currentArtist = artist;
        this.fetchTracks();
    }

    async fetchData() {
        this.isLoading = true;
        this.tracks = [];
        this.artists = [];
        this.albums = [];
        this.playlists = [];
        this.settings.offset = 0;
        const res = await this.ss.search(this.searchType, this.term, this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading = false;
            return;
        }
        const search = res.val as ISearchResult;
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

            this.albums = _.map(search.albums.items, (album, index) => new AlbumViewModelItem(album));
        } else if ('playlists' in search && search.playlists) {
            this.settings.total = search.playlists.total;
            this.settings.offset = search.playlists.offset + Math.min(this.settings.limit, search.playlists.items.length);

            this.playlists = _.map(search.playlists.items, (playlist, index) => new PlaylistsViewModelItem(playlist));
        }
        this.isLoading = false;
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading = true;
        const res = await this.ss.search(this.searchType, this.term, this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading = false;
            return;
        }
        const search = res.val;
        if (search?.tracks) {
            this.tracksAddRange(_.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, search.tracks!.offset + index)));

            this.settings.total = search.tracks.total;
            this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);
        } else if (search?.artists) {
            this.artistsAddRange(_.map(search.artists.items, (artist, index) => new ArtistViewModelItem(artist, search.artists!.offset + index)));

            this.settings.total = search.artists.total;
            this.settings.offset = search.artists.offset + Math.min(this.settings.limit, search.artists.items.length);
        } else if (search?.albums) {
            this.albumsAddRange(_.map(search.albums.items, (album, index) => new AlbumViewModelItem(album)));

            this.settings.total = search.albums.total;
            this.settings.offset = search.albums.offset + Math.min(this.settings.limit, search.albums.items.length);
        } else if (search?.playlists) {
            this.playlistsAddRange(_.map(search.playlists.items, (artist, index) => new PlaylistsViewModelItem(artist)));

            this.settings.total = search.playlists.total;
            this.settings.offset = search.playlists.offset + Math.min(this.settings.limit, search.playlists.items.length);
        }
        this.isLoading = false;
    }

    async fetchTracks() {
        this.currentTracks = [];

        if (this.searchType === 'album' && this.currentAlbum) {
            const albumTrackssResult = await this.spotifyService.listAlbumTracks(this.currentAlbum!.id());

            return albumTrackssResult.assert(e => this.errors = [e])
                .cata(tr => this.currentTracks = _.map(tr.items, (item, index) => new TrackViewModelItem({ track: item } as any, index)));
        }

        if (this.searchType === 'playlist' && this.currentPlaylist) {
            const playlistTracksResult = await this.spotifyService.fetchPlaylistTracks(this.currentPlaylist!.id());

            return playlistTracksResult.assert(e => this.errors = [e])
                .cata(tr => this.currentTracks = _.map(tr.items, (item, index) => new TrackViewModelItem(item, index)));
        }

        if (this.searchType === 'artist' && this.currentArtist) {
            const artistTracksResult = await this.spotifyService.fetchArtistTopTracks(this.currentArtist!.id(), 'US');

            return artistTracksResult.assert(e => this.errors = [e])
                .cata(tr => this.currentTracks = _.map(tr.tracks, (item, index) => new TrackViewModelItem({ track: item } as any, index)));
        }

    }

    tracksAddRange(value: TrackViewModelItem[]) {
        const array = [...this.tracks, ...value];
        this.tracks = array;
    }

    artistsAddRange(value: ArtistViewModelItem[]) {
        const array = [...this.artists, ...value];
        this.artists = array;
    }

    albumsAddRange(value: AlbumViewModelItem[]) {
        const array = [...this.albums, ...value];
        this.albums = array;
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]) {
        const array = [...this.playlists, ...value];
        this.playlists = array;
    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.tracks);
    }
}

export { SearchViewModel };

