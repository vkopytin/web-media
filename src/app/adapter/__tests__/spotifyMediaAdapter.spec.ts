/* eslint-disable */

import { SpotifyMediaAdapter } from '../spotifyMediaAdapter';
import each from 'jest-each';
import { ErrorWithStatus } from '../errors/errorWithStatus';

describe('Spotify Media Adapter', () => {
    let spotifyMediaAdapter: SpotifyMediaAdapter;
    let urlDomain = 'https://api.spotify.com';
    let token = 'test';
    let headers = {
        'Authorization': 'Bearer ' + token
    };

    beforeEach(() => {
        spotifyMediaAdapter = new SpotifyMediaAdapter(token);
    });

    it('should throw error with status 401 The access token expired message', async () => {
        const errorWithMessage = {
            error: {
                message: 'The access token expired',
            },
        };
        try {
            jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 401,
                text: jest.fn().mockImplementation(() => Promise.resolve(JSON.stringify(errorWithMessage))),
            } as any));

            await spotifyMediaAdapter.me();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('The access token expired', 401, '401 error', ex));
        }
    });

    it('should throw error with status 503 Service unavailable message', async () => {
        const errorWithMessage = {
            error: {
                message: 'Service unavailable',
            },
        };
        try {
            jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 503,
                text: jest.fn().mockImplementation(() => Promise.resolve(JSON.stringify(errorWithMessage))),
            } as any));

            await spotifyMediaAdapter.me();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('Service unavailable', 503, '503 error', ex));
        }
    });

    it('should throw some error', async () => {
        const errorWithMessage = {
            error: 'Some error',
        };
        try {
            jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 400,
                text: jest.fn().mockImplementation(() => Promise.resolve(JSON.stringify(errorWithMessage))),
            } as any));

            await spotifyMediaAdapter.me();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('Some error', 400, '400 error', ex));
        }
    });

    it('should throw unexpected error', async () => {
        const errorWithMessage = '{}';
        try {
            jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 400,
                text: jest.fn().mockImplementation(() => Promise.resolve(errorWithMessage)),
            } as any));

            await spotifyMediaAdapter.me();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('{}', 400, '400 error', ex));
        }
    });

    it('should request me', async () => {
        const displayName = 'test-name';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve({ display_name: displayName })),
        } as any));

        const result = await spotifyMediaAdapter.me();

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me`, {
            headers
        });
        expect(result).toEqual({
            display_name: displayName
        });
    });

    each([
        ['seed_artists=test-123', 'test-123', undefined],
        ['seed_tracks=test-123', undefined, 'test-123'],
        ['seed_artists=test-123&seed_tracks=test-456', 'test-123', 'test-456'],
    ]).it('should request recommendations', (expected, seedArtists, seedTracks) => {

        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.recommendations('test', seedArtists, seedTracks);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/recommendations?market=test&${expected}&min_energy=0.4&min_popularity=50&limit=20`, {
            headers
        });
    });

    it('should request user playlists', () => {
        const userId = 'user-id-123';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.userPlaylists(userId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/users/${userId}/playlists`, {
            headers
        });
    });

    it('should request create new playlist', () => {
        const userId = 'user-id-123';
        const name = 'playlist-title';
        const method = 'POST';
        const description = 'playlist description';
        const body = {
            name,
            description,
            public: true
        };
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.createNewPlaylist(userId, name, description, true);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/users/${userId}/playlists`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    it('should request my playlists ', () => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.myPlaylists(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/playlists?offset=${offset}&limit=${limit}`, {
            headers: {
                ...headers,
            },
        });
    });

    each([
        ['track-id-123', ['track-id-123']],
        [['track-id-123', 'track-id2'], ['track-id-123', 'track-id2']]
    ]).it('should request add track to playlist', (trackId, expectedUris) => {
        const playlistId = 'playlist-id-123';
        const method = 'POST';
        const body = {
            uris: expectedUris
        };
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.addTrackToPlaylist(trackId, playlistId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/${playlistId}/tracks`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    each([
        ['track-id-123', ['track-id-123']],
        [['track-id-123', 'track-id2'], ['track-id-123', 'track-id2']]
    ]).it('should request remove track to playlist', (trackId, expectedUris) => {
        const playlistId = 'playlist-id-123';
        const method = 'DELETE';
        const body = {
            uris: expectedUris
        };
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.removeTrackFromPlaylist(trackId, playlistId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/${playlistId}/tracks`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    it('should request playlist details', () => {
        const playlistId = 'playlist-id-123';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.getPlaylistDetails(playlistId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/${playlistId}`, {
            headers
        });
    });

    it('should request playlist tracks', () => {
        const playlistId = 'playlist-id-123';
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.listPlaylistTracks(playlistId, offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request my top artists', () => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.myTopArtists(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/top/artists?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request my top tracks', () => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.myTopTracks(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/top/tracks?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request artist\'s top tracks', () => {
        const artistId = 'artist-id-123';
        const country = 'US';
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.listArtistTopTracks(artistId, country, offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/artists/${artistId}/top-tracks?country=${country}&offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request album\'s tracks', () => {
        const albumId = 'album-id-123';
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.listAlbumTracks(albumId, offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/albums/${albumId}/tracks?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request album\'s details', () => {
        const albumId = 'album-id-123';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.getAlbumDetails(albumId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/albums/${albumId}`, {
            headers,
        });
    });

    it('should request new releases', () => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.newReleases(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/browse/new-releases?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    each([
        ['country=US&locale=en-US&timestamp=1675025802416&', 'US', 'en-US', '1675025802416'],
        ['country=US&locale=en-US&', 'US', 'en-US', undefined],
        ['country=US&timestamp=1675025802416&', 'US', undefined, '1675025802416'],
        ['country=US&', 'US', undefined, undefined],
        ['', undefined, undefined, undefined],
    ]).it('should request featured playlists', (expected, country, locale, timestamp) => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.featuredPlaylists(offset, limit, country, locale, timestamp);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/browse/featured-playlists?${expected}offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    each([
        ['country=US&locale=en-US&timestamp=1675025802416&', 'US', 'en-US', '1675025802416'],
        ['country=US&locale=en-US&', 'US', 'en-US', undefined],
        ['country=US&timestamp=1675025802416&', 'US', undefined, '1675025802416'],
        ['country=US&', 'US', undefined, undefined],
        ['', undefined, undefined, undefined],
    ]).it('should request categories', (expected, country, locale, timestamp) => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.categories(offset, limit, country, locale, timestamp);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/browse/categories?${expected}offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request search by term', () => {
        const offset = 3;
        const limit = 14;
        const term = '{term}';
        const searchType = 'track';
        const expectedTerm = '%7Bterm%7D';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.search(searchType, term, offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/search?q=${expectedTerm}&type=${searchType}&offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request my tracks', () => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.tracks(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/tracks?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    it('should request my albums', () => {
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.albums(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/albums?offset=${offset}&limit=${limit}`, {
            headers,
        });
    });

    each([
        ['track-id-123', 'track-id-123'],
        ['track-id-123%2Ctrack-id-4343', ['track-id-123', 'track-id-4343']],
    ]).it('should request add track', (expected, trackIds) => {
        const method = 'PUT';
        const body = {};
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.addTracks(trackIds);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/tracks?ids=${expected}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    each([
        ['track-id-123', 'track-id-123'],
        ['track-id-123%2Ctrack-id-4343', ['track-id-123', 'track-id-4343']],
    ]).it('should request remove track', (expected, trackIds) => {
        const method = 'DELETE';
        const body = {};
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.removeTracks(trackIds);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/tracks?ids=${expected}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    each([
        ['track-id-123', 'track-id-123'],
        ['track-id-123%2Ctrack-id-4343', ['track-id-123', 'track-id-4343']],
    ]).it('should request has tracks', (expected, trackIds) => {
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.hasTracks(trackIds);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/tracks/contains?ids=${expected}`, {
            headers,
        });
    });

    each([
        ['album-id-123', 'album-id-123'],
        ['album-id-123%2Calbum-id-4343', ['album-id-123', 'album-id-4343']],
    ]).it('should request add albums', (expected, albumIds) => {
        const method = 'PUT';
        const body = {};
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.addAlbums(albumIds);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/albums?ids=${expected}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    each([
        ['album-id-123', 'album-id-123'],
        ['album-id-123%2Calbum-id-4343', ['album-id-123', 'album-id-4343']],
    ]).it('should request remove album', (expected, albumIds) => {
        const method = 'DELETE';
        const body = {};
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.removeAlbums(albumIds);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/albums?ids=${expected}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });

    each([
        ['album-id-123', 'album-id-123'],
        ['album-id-123%2Calbum-id-4343', ['album-id-123', 'album-id-4343']],
    ]).it('should request has album', async (expected, albumIds) => {
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyMediaAdapter.hasAlbums(albumIds);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/albums/contains?ids=${expected}`, {
            headers,
        });
    });

    it('should request reorder tracks', () => {
        const method = 'PUT';
        const playlistId = 'playlist-id-123';
        const rangeStart = 2;
        const insertBefore = 5;
        const rangeLength = 1;
        const body = {
            range_start: rangeStart,
            insert_before: insertBefore,
            range_length: rangeLength
        };
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.reorderTracks(playlistId, rangeStart, insertBefore, rangeLength);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/${playlistId}/tracks`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    });
});
