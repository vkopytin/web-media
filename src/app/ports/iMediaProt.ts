export interface IImageInfo {
    width: number;
    height: number;
    url: string;
}

export interface IUserInfo {
    birthdate?: string;
    country?: 'PL' | string;
    display_name?: string;
    email?: string;
    explicit_content?: {
        filter_enabled?: boolean;
        filter_locked?: boolean;
    };
    external_urls?: {
        spotify?: string;
    };
    followers?: {
        href?: string;
        total?: number;
    };
    href?: string;
    id?: string;
    images?: IImageInfo[];
    product?: 'open' | string;
    type?: 'user' | string;
    uri?: string;
}

export interface IArtist {
    external_urls: {
        spotify: string;
    };
    images: IImageInfo[];
    spotify: string;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface IAlbum {
    album_type: string;
    id: string;
    name: string;
    uri: string;
    artists: IArtist[];
    images: Array<IImageInfo>;
    total_tracks: number;
    release_date: string;
    external_urls: {
        spotify: string;
    };
}

export interface ITrack {
    id: string;
    name: string;
    album: IAlbum;
    artists: IArtist[];
    uri: string;
    duration_ms?: number;
    track_number?: number;
}

export interface ISpotifySong {
    track: ITrack;
    played_at?: string;
    added_at: string;
    position?: number;
}

export interface IResponseResult<T> {
    href: string;
    items: T[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
}

export interface IUserPlaylist {
    id: string;
    name: string;
    description: string;
    uri: string;
    tracks: {
        total: number;
    };
    images: Array<IImageInfo>;
    owner: IUserInfo;
    snapshot_id: string;
}

export interface IRecommendationsResult {
    tracks: ITrack[];
    seeds: Array<unknown>;
}

export interface ITopTracksResult {
    tracks: ITrack[];
}

export interface ISearchResult {
    tracks?: IResponseResult<ITrack>;
    artists?: IResponseResult<IArtist>;
    albums?: IResponseResult<IAlbum>;
    playlists?: IResponseResult<IUserPlaylist>;
}

export interface IUserPlaylistsResult {
    index?: number;
    href: string;
    items: IUserPlaylist[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
}

export interface IReorderTracksResult {
    snapshot_id: string;
}

export interface ICategory {
    id: string;
    name: string;
    href: string;
    icons: IImageInfo[];
}

export interface IBrowseResult {
    tracks?: IResponseResult<ITrack>;
    artists?: IResponseResult<IArtist>;
    albums?: IResponseResult<IAlbum>;
    playlists?: IResponseResult<IUserPlaylist>;
    categories?: IResponseResult<ICategory>;
}

export interface ISpotifyAlbum {
    added_at: string;
    album: IAlbum;
}

export type ISearchType = 'track' | 'album' | 'artist' | 'playlist';

export interface IMediaPort {
    token: string;
    me(): Promise<IUserInfo>;
    userPlaylists(userId: string): Promise<IUserPlaylistsResult>;
    myPlaylists(offset?: number, limit?: number): Promise<IUserPlaylistsResult>;
    listPlaylistTracks(playlistId: string, offset?: number, limit?: number): Promise<IResponseResult<ISpotifySong>>;
    myTopTracks(offset?: number, limit?: number): Promise<IResponseResult<ITrack>>;
    listArtistTopTracks(artistId: string, country?: string): Promise<ITopTracksResult>;
    addTracks(trackIds: string | string[]): Promise<IResponseResult<ISpotifySong>>;
    removeTracks(trackIds: string | string[]): Promise<IResponseResult<ISpotifySong>>;
    hasTracks(trackIds: string | string[]): Promise<boolean[]>;
    addAlbums(albumIds: string | string[]): Promise<IResponseResult<ISpotifySong>>;
    removeAlbums(albumIds: string | string[]): Promise<IResponseResult<ISpotifySong>>;
    hasAlbums(albumIds: string | string[]): Promise<boolean[]>;
    reorderTracks(playlistId: string, rangeStart: number, insertBefore: number, rangeLength?: number): Promise<IReorderTracksResult>;
    listAlbumTracks(albumId: string, offset?: number, limit?: number): Promise<IResponseResult<ITrack>>;
    newReleases(offset?: number, limit?: number): Promise<ISearchResult>;
    featuredPlaylists(offset?: number, limit?: number, country?: string, locale?: string, timestamp?: string): Promise<ISearchResult>;
    search(searchType: ISearchType, term: string, offset?: number, limit?: number): Promise<ISearchResult>;
    tracks(offset?: number, limit?: number): Promise<IResponseResult<ISpotifySong>>;
    albums(offset?: number, limit?: number): Promise<IResponseResult<ISpotifyAlbum>>;
    createNewPlaylist(userId: string, name: string, description?: string, isPublic?: boolean): Promise<unknown>;
    addTrackToPlaylist(trackUris: string | string[], playlistId: string): Promise<ISpotifySong>;
    removeTrackFromPlaylist(trackUris: string | string[], playlistId: string): Promise<IResponseResult<ISpotifySong>>;
}
