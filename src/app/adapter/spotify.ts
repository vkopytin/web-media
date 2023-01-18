import { Result } from '../utils/result';
import { ErrorWithStatus } from './errors/errorWithStatus';

export interface IImageInfo {
    width: number;
    height: number;
    url: string;
};

export interface IDevice {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
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
};

export interface ITrack {
    id: string;
    name: string;
    album: IAlbum;
    artists: IArtist[];
    uri: string;
    duration_ms?: number;
    track_number?: number;
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

export interface ISpotifySong {
    track: ITrack;
    played_at?: string;
    added_at: string;
    position?: number;
}

export interface IDevicesResponse {
    devices: IDevice[];
}

export interface IRecommendationsResult {
    tracks: ITrack[];
    seeds: Array<{}>;
}

export interface ITopTracksResult {
    tracks: ITrack[];
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

export interface IResponseResult<T> {
    href: string;
    items: T[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
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

export interface IPlayerResult {
    device: IDevice;
    shuffle_state: boolean;
    repeat_state: 'off' | string;
    timestamp: number;
    context: {};
    progress_ms: number;
    item: ITrack;
    currently_playing_type: 'track' | string;
    actions: {
        disallows: {
            resuming: boolean;
        }
    };
    is_playing: boolean;
}

export interface ICurrentlyPlayingResult {
    timestamp: number;
    context: {};
    progress_ms: number;
    item: ITrack;
    currently_playing_type: 'track' | string;
    actions: {
        disallows: {
            resuming: boolean;
        }
    };
    is_playing: boolean;
}

export interface IReorderTracksResult {
    snapshot_id: string;
}

export interface ICategory {
    id: string;
    name: string;
    href: string;
    icons: IImageInfo[];
};

export interface IBrowseResult {
    tracks?: IResponseResult<ITrack>;
    artists?: IResponseResult<IArtist>;
    albums?: IResponseResult<IAlbum>;
    playlists?: IResponseResult<IUserPlaylist>;
    categories?: IResponseResult<ICategory>;
}

export interface IPLayerQueueResult {
    currently_playing: {};
    queue: ITrack[];
}

export interface ISpotifyAlbum {
    added_at: string;
    album: IAlbum;
}

export type ISearchType = 'track' | 'album' | 'artist' | 'playlist';

const delayWithin = (ms = 800) => new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
});

const resultOrError = async <T>(response: Response): Promise<T> => {
    if ([200].indexOf(response.status) !== -1) {
        const text = await response.text();
        if (text === '') {
            return undefined as T;
        }
        const result = JSON.parse(text);

        return result;
    } else if (204 === response.status) {
        return undefined as T;
    } else {
        const result = await response.text();
        const res = JSON.parse(result);

        if (!('error' in res)) {
            throw new ErrorWithStatus(result, response.status, response.statusText);
        }

        const error = res.error;
        if (!('message' in error)) {
            throw new ErrorWithStatus(res.error, response.status, response.statusText);
        }

        throw new ErrorWithStatus(error.message, response.status, response.statusText, res);
    }
}

const toString = (obj: { toString?: () => string }) => {
    try {
        if (typeof obj === 'undefined') {
            return '';
        }
        if (obj === null) {
            return '';
        }
        if (typeof obj === 'number') {
            return '' + obj;
        }
        if (typeof obj === 'string') {
            return obj;
        }

        if ('toString' in obj) {
            return obj.toString?.();
        }

        return '' + obj;
    } catch (ex) {
        console.log(ex);
    }
};
const toUrlQueryParams = (obj: {}) => Object.entries<{}>(obj)
    .map(([key, value]) => [key, toString(value)])
    .map(([key, value]) => `${key}=${encodeURIComponent(value || '')}`)
    .join('&');

const baseUrl = 'https://api.spotify.com';

let index = 0;

class SpotifyAdapter {
    fetch: typeof fetch = async (input, init) => {
        if (index++ % 3 === 0) {
            input = ('' + input).replace('?', '/fail?') + 'fail';
        }
        return await fetch(input, init);
    }

    constructor(public token: string) {

    }

    async me(): Promise<IUserInfo> {
        const response = await this.fetch(`${baseUrl}/v1/me`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });
        const result = await resultOrError<IUserInfo>(response);

        return result;
    }

    async recentlyPlayed(before = new Date() as Date | number, limit = 20): Promise<IResponseResult<ISpotifySong>> {
        before = +before;
        const response = await this.fetch(`${baseUrl}/v1/me/player/recently-played?` + toUrlQueryParams({
            before, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });

        return await resultOrError<IResponseResult<ISpotifySong>>(response);
    }

    async devices(): Promise<IDevicesResponse> {
        await delayWithin();

        const response = await this.fetch(`${baseUrl}/v1/me/player/devices`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError<IDevicesResponse>(response);
    }

    async recommendations(
        market: string,
        seedArtists: string | string[], seedTracks: string | string[],
        minEnergy = 0.4, minPopularity = 50, limit = 0
    ): Promise<IRecommendationsResult> {
        const response = await this.fetch(`${baseUrl}/v1/recommendations?` + toUrlQueryParams({
            market,
            seed_artists: ([] as string[]).concat(seedArtists).join(','),
            seed_tracks: ([] as string[]).concat(seedTracks).join(','),
            min_energy: minEnergy,
            min_popularity: minPopularity,
            limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });

        return await resultOrError<IRecommendationsResult>(response);
    }

    async userPlaylists(userId: string): Promise<IUserPlaylistsResult> {
        const response = await this.fetch(`${baseUrl}/v1/users/${userId}/playlists`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError<IUserPlaylistsResult>(response);
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false): Promise<unknown> {
        const data = {
            name,
            description,
            public: isPublic
        };
        const response = await this.fetch(`${baseUrl}/v1/users/${userId}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        return await resultOrError(response);
    }

    async myPlaylists(offset = 0, limit = 20): Promise<IUserPlaylistsResult> {
        const response = await this.fetch(`${baseUrl}/v1/me/playlists?` + toUrlQueryParams({
            offset,
            limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError<IUserPlaylistsResult>(response);
    }

    async addTrackToPlaylist(trackUris: string | string[], playlistId: string): Promise<ISpotifySong> {
        const response = await this.fetch(`${baseUrl}/v1/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: ([] as string[]).concat(trackUris)
            })
        });

        return await resultOrError<ISpotifySong>(response);
    }

    async removeTrackFromPlaylist(trackUris: string | string[], playlistId: string): Promise<IResponseResult<ISpotifySong>> {
        const response = await this.fetch(`${baseUrl}/v1/playlists/${playlistId}/tracks`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uris: ([] as string[]).concat(trackUris)
            })
        });

        return await resultOrError<IResponseResult<ISpotifySong>>(response);
    }

    async getPlaylistDetails(playlistId: string): Promise<IUserPlaylist> {
        const response = await this.fetch(`${baseUrl}/v1/playlists/${playlistId}`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError<IUserPlaylist>(response);
    }

    async listPlaylistTracks(playlistId: string, offset = 0, limit = 20): Promise<IResponseResult<ISpotifySong>> {
        const response = await this.fetch(`${baseUrl}/v1/playlists/${playlistId}/tracks?` + toUrlQueryParams({
            offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError<IResponseResult<ISpotifySong>>(response);
    }

    async myTopArtists(offset = 0, limit = 20): Promise<IResponseResult<IArtist>> {
        const response = await this.fetch(`${baseUrl}/v1/me/top/artists?` + toUrlQueryParams({
            offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async myTopTracks(offset = 0, limit = 20): Promise<IResponseResult<ITrack>> {
        const response = await this.fetch(`${baseUrl}/v1/me/top/tracks?` + toUrlQueryParams({
            offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async artistTopTracks(artistId: string, country = 'US'): Promise<ITopTracksResult> {
        const response = await this.fetch(`${baseUrl}/v1/artists/${artistId}/top-tracks?` + toUrlQueryParams({
            country: country
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async listAlbumTracks(albumId: string, offset = 0, limit = 20): Promise<IResponseResult<ITrack>> {
        const response = await this.fetch(`${baseUrl}/v1/albums/${albumId}/tracks?` + toUrlQueryParams({
            offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async listArtistTopTracks(artistId: string, country = 'US', offset = 0, limit = 20): Promise<{ tracks: ITrack[] }> {
        const response = await this.fetch(`${baseUrl}/v1/artists/${artistId}/top-tracks?` + toUrlQueryParams({
            country, offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async getAlbumDetails(albumId: string): Promise<IAlbum> {
        const response = await this.fetch(`${baseUrl}/v1/albums/${albumId}`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async play(tracksUriList?: string | string[], indexOrUri: number | string = '', deviceId?: string) {
        const urlParts = [`${baseUrl}/v1/me/player/play`];
        const numberRx = /^\d+$/i;
        const position = numberRx.test('' + indexOrUri) ? +indexOrUri! : -1;
        const uri = (!numberRx.test('' + indexOrUri)) ? indexOrUri : '';
        const uris = ([] as string[]).concat(tracksUriList || []);
        const contextUri = uris.length === 1 ? uris[0] : '';
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify((tracksUriList && tracksUriList.length) ? {
                ...contextUri ? { context_uri: contextUri } : { uris },

                ...uri ? { offset: { uri } }
                    : position !== -1 ? { offset: { position } }
                        : {}
            } : {}),
        });

        return await resultOrError(response);
    }

    async next(deviceId: string = ''): Promise<unknown> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/player/next`];
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async previous(deviceId: string = ''): Promise<unknown> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/player/previous`];
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async pause(deviceId: string = ''): Promise<unknown> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/player/pause`];
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async newReleases(offset = 0, limit = 20): Promise<ISearchResult> {
        const response = await this.fetch(`${baseUrl}/v1/browse/new-releases?` + toUrlQueryParams({
            offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string): Promise<ISearchResult> {
        const response = await this.fetch(`${baseUrl}/v1/browse/featured-playlists?` + toUrlQueryParams({
            ...country ? { country } : {},
            ...locale ? { locale } : {},
            ...timestamp ? { timestamp } : {},
            ...offset ? { offset } : {},
            limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async categories(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string): Promise<IBrowseResult> {
        const response = await this.fetch(`${baseUrl}/v1/browse/categories?` + toUrlQueryParams({
            ...country ? { country } : {},
            ...locale ? { locale } : {},
            ...timestamp ? { timestamp } : {},
            ...offset ? { offset } : {},
            limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async search(searchType: ISearchType, term: string, offset = 0, limit = 20): Promise<ISearchResult> {
        const response = await this.fetch(`${baseUrl}/v1/search?` + toUrlQueryParams({
            q: term,
            type: searchType,
            ...offset ? { offset: offset } : {},
            limit: limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async player(deviceId = '', play = null as boolean | null): Promise<IPlayerResult> {
        await delayWithin();
        const response = await this.fetch(`${baseUrl}/v1/me/player`, {
            method: play === null ? 'GET' : 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            ...play === null ? {} : {
                body: JSON.stringify({
                    device_ids: ([] as string[]).concat(deviceId),
                    play: play
                })
            }
        });

        return await resultOrError(response);
    }

    async queue(): Promise<IPLayerQueueResult> {
        const response = await this.fetch(`${baseUrl}/v1/me/player/queue`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
        });

        return await resultOrError(response);
    }

    async seek(positionMs: number, deviceId = ''): Promise<void> {
        const response = await this.fetch(`${baseUrl}/v1/me/player/seek?` + toUrlQueryParams({
            position_ms: positionMs,
            ...deviceId ? { device_id: deviceId } : {}
        }), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async currentlyPlaying(): Promise<ICurrentlyPlayingResult> {
        const response = await this.fetch(`${baseUrl}/v1/me/player/currently-playing`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async tracks(offset = 0, limit = 20): Promise<IResponseResult<ISpotifySong>> {
        const response = await this.fetch(`${baseUrl}/v1/me/tracks?` + toUrlQueryParams({
            offset: offset,
            limit: limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });

        return await resultOrError(response);
    }

    async albums(offset = 0, limit = 20): Promise<IResponseResult<ISpotifyAlbum>> {
        const response = await this.fetch(`${baseUrl}/v1/me/albums?` + toUrlQueryParams({
            offset, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });

        return await resultOrError(response);
    }

    async addTracks(trackIds: string | string[]): Promise<IResponseResult<ISpotifySong>> {
        const urlParts = [`${baseUrl}/v1/me/tracks`];
        urlParts.push(`ids=${encodeURIComponent(([] as string[]).concat(trackIds).join(','))}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async removeTracks(trackIds: string | string[]): Promise<IResponseResult<ISpotifySong>> {
        const urlParts = [`${baseUrl}/v1/me/tracks`];
        urlParts.push(`ids=${encodeURIComponent(([] as string[]).concat(trackIds).join(','))}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async hasTracks(trackIds: string | string[]): Promise<boolean[]> {
        const urlParts = [`${baseUrl}/v1/me/tracks/contains`];
        urlParts.push(`ids=${encodeURIComponent(([] as string[]).concat(trackIds).join(','))}`);

        const response = await this.fetch(urlParts.join('?'), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async volume(precent: number, deviceId?: string): Promise<IResponseResult<ISpotifySong>> {

        const response = await this.fetch(`${baseUrl}/v1/me/player/volume?` + toUrlQueryParams({
            volume_percent: precent,
            ...deviceId ? { device_id: deviceId } : {}
        }), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async addAlbums(albumIds: string | string[]): Promise<IResponseResult<ISpotifySong>> {
        const urlParts = [`${baseUrl}/v1/me/albums`];
        urlParts.push(`ids=${encodeURIComponent(([] as string[]).concat(albumIds).join(','))}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async removeAlbums(albumIds: string | string[]): Promise<IResponseResult<ISpotifySong>> {
        const urlParts = [`${baseUrl}/v1/me/albums`];
        urlParts.push(`ids=${encodeURIComponent(([] as string[]).concat(albumIds).join(','))}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async hasAlbums(albumIds: string | string[]): Promise<boolean[]> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/albums/contains`];
        urlParts.push(`ids=${encodeURIComponent(([] as string[]).concat(albumIds).join(','))}`);

        const response = await this.fetch(urlParts.join('?'), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async reorderTracks(playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1): Promise<IReorderTracksResult> {
        const response = await this.fetch(`${baseUrl}/v1/playlists/${playlistId}/tracks`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range_start: rangeStart,
                insert_before: insertBefore,
                range_length: rangeLength
            }),
        });

        return await resultOrError(response);
    }
}

export { SpotifyAdapter };
