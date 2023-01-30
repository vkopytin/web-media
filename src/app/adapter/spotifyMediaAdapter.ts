import { IMediaPort, IUserInfo, IResponseResult, ISpotifySong, IRecommendationsResult, IUserPlaylistsResult, IUserPlaylist, IArtist, ITrack, ITopTracksResult, IAlbum, ISearchResult, ISearchType, IBrowseResult, ISpotifyAlbum, IReorderTracksResult } from '../ports/iMediaProt';
import { ErrorWithStatus } from './errors/errorWithStatus';

const delayWithin = (ms = 800) => new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
});

const resultOrError = async <T,>(response: Response): Promise<T> => {
    if ([200, 202, 204].indexOf(response.status) !== -1) {
        const text = await response.text();
        if (!text) {
            return text as T;
        }
        try {
            return JSON.parse(text);
        } catch (ex) {
            return text as T;
        }
    } else if (response.status > 200 && response.status < 300) {
        return undefined as T;
    } else {
        const result = await response.text();
        const res = JSON.parse(result);

        if (!(typeof (res) === 'object' && 'error' in res)) {
            throw new ErrorWithStatus(result, response.status, response.statusText);
        }

        const error = res.error;
        if (!(typeof (error) === 'object' && 'message' in error)) {
            throw new ErrorWithStatus(error, response.status, response.statusText);
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
const toUrlQueryParams = (obj: object) => Object.entries(obj)
    .map(([key, value]) => [key, toString(value)])
    .map(([key, value]) => `${key}=${encodeURIComponent(value || '')}`)
    .join('&');

const baseUrl = 'https://api.spotify.com';

//let index = 0;

export class SpotifyMediaAdapter implements IMediaPort {
    fetch: typeof fetch = async (input, init) => {
        //if (index++ % 3 === 0) {
        //    input = ('' + input).replace('?', '/fail?') + 'fail';
        //}
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
