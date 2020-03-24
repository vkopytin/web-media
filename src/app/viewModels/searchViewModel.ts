import * as _ from 'underscore';
import { IResponseResult, ISearchResult, ISearchType, ISpotifySong, ITrack } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, asyncQueue, current } from '../utils';
import { AlbumViewModelItem } from './albumViewModelItem';
import { ArtistViewModelItem } from './artistViewModelItem';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { SpotifyService } from '../service/spotify';


const searchQueue = asyncQueue();

class SearchViewModel extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
        term: '',
        searchType: 'track' as ISearchType,
        isLoading: false,
        tracks: [] as TrackViewModelItem[],
        artists: [] as ArtistViewModelItem[],
        albums: [] as AlbumViewModelItem[],
        playlists: [] as PlaylistsViewModelItem[],
        offset: 0,
        total: 0,
        limit: 20,
        currentMediaUri: null,
        currentAlbum: null as AlbumViewModelItem,
        currentPlaylist: null as PlaylistsViewModelItem,
        currentArtist: null as ArtistViewModelItem,
        currentTracks: [] as TrackViewModelItem[]
    };

    loadMoreCommand = { exec: () => this.loadMore() };

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    isLoading(val?) {
        if (arguments.length && val !== this.settings.isLoading) {
            this.settings.isLoading = val;
            this.trigger('change:isLoading');
        }

        return this.settings.isLoading;
    }

    term(val?) {
        if (arguments.length && val !== this.settings.term) {
            this.settings.term = val;
            this.trigger('change:term');

            searchQueue.push(_.bind(async function (this: SearchViewModel, next) {
                if (this.settings.term) {
                    await this.fetchData();
                    next();
                } else {
                    this.tracks([]);
                    next();
                }
            }, this));
        }

        return this.settings.term;
    }

    tracks(val?: any[]) {
        if (arguments.length && val !== this.settings.tracks) {
            this.settings.tracks = val;
            this.trigger('change:tracks');
        }

        return this.settings.tracks;
    }

    artists(val?: any[]) {
        if (arguments.length && val !== this.settings.artists) {
            this.settings.artists = val;
            this.trigger('change:artists');
        }

        return this.settings.artists;
    }

    albums(val?: any[]) {
        if (arguments.length && val !== this.settings.albums) {
            this.settings.albums = val;
            this.trigger('change:albums');
        }

        return this.settings.albums;
    }

    playlists(val?: any[]) {
        if (arguments.length && val !== this.settings.playlists) {
            this.settings.playlists = val;
            this.trigger('change:playlists');
        }

        return this.settings.playlists;
    }

    searchType(val?: any[]) {
        if (arguments.length && val !== this.settings.searchType) {
            this.settings.searchType = val;
            this.trigger('change:searchType');

            this.fetchData();
        }

        return this.settings.searchType;
    }

    currentAlbum(val?: AlbumViewModelItem) {
        if (arguments.length && val !== this.settings.currentAlbum) {
            this.settings.currentAlbum = val;
            this.trigger('change:currentAlbum');

            this.fetchTracks();
        }

        return this.settings.currentAlbum;
    }

    currentPlaylist(val?: PlaylistsViewModelItem) {
        if (arguments.length && val !== this.settings.currentPlaylist) {
            this.settings.currentPlaylist = val;
            this.trigger('change:currentPlaylist');

            this.fetchTracks();
        }

        return this.settings.currentPlaylist;
    }

    currentArtist(val?: ArtistViewModelItem) {
        if (arguments.length && val !== this.settings.currentArtist) {
            this.settings.currentArtist = val;
            this.trigger('change:currentArtist');

            this.fetchTracks();
        }

        return this.settings.currentArtist;
    }

    currentTracks(val?: TrackViewModelItem[]) {
        if (arguments.length && val !== this.settings.currentTracks) {
            this.settings.currentTracks = val;
            this.trigger('change:currentTracks');
        }

        return this.settings.currentTracks;
    }

    async fetchData() {
        this.isLoading(true);
        this.tracks([]);
        this.artists([]);
        this.albums([]);
        this.playlists([]);
        this.settings.offset = 0;
        const res = await this.ss.search(this.searchType(), this.term(), this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const search = res.val as ISearchResult;
        if ('tracks' in search) {
            this.settings.total = search.tracks.total;
            this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);

            this.tracks(_.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index)));
        } else if ('artists' in search) {
            this.settings.total = search.artists.total;
            this.settings.offset = search.artists.offset + Math.min(this.settings.limit, search.artists.items.length);
    
            this.artists(_.map(search.artists.items, (artist, index) => new ArtistViewModelItem(artist, index)));
        } else if ('albums' in search) {
            this.settings.total = search.albums.total;
            this.settings.offset = search.albums.offset + Math.min(this.settings.limit, search.albums.items.length);
    
            this.albums(_.map(search.albums.items, (album, index) => new AlbumViewModelItem(album)));
        } else if ('playlists' in search) {
            this.settings.total = search.playlists.total;
            this.settings.offset = search.playlists.offset + Math.min(this.settings.limit, search.playlists.items.length);
    
            this.playlists(_.map(search.playlists.items, (playlist, index) => new PlaylistsViewModelItem(playlist)));
        }
        this.isLoading(false);
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading(true);
        const res = await this.ss.search(this.searchType(), this.term(), this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const search = res.val as ISearchResult;
        if ('tracks' in search) {
            this.tracksAddRange(_.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, search.tracks.offset + index)));

            this.settings.total = search.tracks.total;
            this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);
        } else if ('artists' in search) {
            this.artistsAddRange(_.map(search.artists.items, (artist, index) => new ArtistViewModelItem(artist, search.artists.offset + index)));

            this.settings.total = search.artists.total;
            this.settings.offset = search.artists.offset + Math.min(this.settings.limit, search.artists.items.length);
        } else if ('albums' in search) {
            this.albumsAddRange(_.map(search.albums.items, (album, index) => new AlbumViewModelItem(album)));

            this.settings.total = search.albums.total;
            this.settings.offset = search.albums.offset + Math.min(this.settings.limit, search.albums.items.length);
        } else if ('playlists' in search) {
            this.playlistsAddRange(_.map(search.playlists.items, (artist, index) => new PlaylistsViewModelItem(artist)));

            this.settings.total = search.playlists.total;
            this.settings.offset = search.playlists.offset + Math.min(this.settings.limit, search.playlists.items.length);
        }
        this.isLoading(false);
    }

    async fetchTracks() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        this.currentTracks([]);
        if (this.searchType() === 'album' && this.currentAlbum()) {
            const albumTrackssResult = await spotifyResult.val.listAlbumTracks(this.currentAlbum().id());
            if (assertNoErrors(albumTrackssResult, e => this.errors(e))) {
                return;
            }
            const tracksResult = albumTrackssResult.val as IResponseResult<ITrack>;
            const tracksModels = _.map(tracksResult.items, (item, index) => new TrackViewModelItem({ track: item } as any, index));
            this.currentTracks(tracksModels);
        } else if (this.searchType() === 'playlist' && this.currentPlaylist()) {
            const playlistTracksResult = await spotifyResult.val.fetchPlaylistTracks(this.currentPlaylist().id());
            if (assertNoErrors(playlistTracksResult, e => this.errors(e))) {
                return;
            }
            const tracksResult = playlistTracksResult.val as IResponseResult<ISpotifySong>;
            const tracksModels = _.map(tracksResult.items, (item, index) => new TrackViewModelItem(item, index));
            this.currentTracks(tracksModels);
        } else if (this.searchType() === 'artist' && this.currentArtist()) {
            const artistTracksResult = await spotifyResult.val.fetchArtistTopTracks(this.currentArtist().id(), 'US');
            if (assertNoErrors(artistTracksResult, e => this.errors(e))) {
                return;
            }
            const tracksResult = artistTracksResult.val as { tracks: ITrack[] };
            const tracksModels = _.map(tracksResult.tracks, (item, index) => new TrackViewModelItem({ track: item } as any, index));
            this.currentTracks(tracksModels);
        }
    }

    tracksAddRange(value: TrackViewModelItem[]) {
        const array = [...this.settings.tracks, ...value];
        this.tracks(array);
    }

    artistsAddRange(value: ArtistViewModelItem[]) {
        const array = [...this.settings.artists, ...value];
        this.artists(array);
    }

    albumsAddRange(value: AlbumViewModelItem[]) {
        const array = [...this.settings.albums, ...value];
        this.albums(array);
    }

    playlistsAddRange(value: PlaylistsViewModelItem[]) {
        const array = [...this.settings.playlists, ...value];
        this.playlists(array);
    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks());
    }
}

export { SearchViewModel };

