import { SpotifyMediaAdapter } from '../spotifyMediaAdapter';
import each from 'jest-each';

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

    it('should request me', () => {
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.me();

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me`, {
            headers
        });
    });

    it('should request recently played', () => {
        const before = +Date();
        const limit = 15;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.recentlyPlayed(before, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/recently-played?before=${before}&limit=${limit}`, {
            headers
        });
    });

    it('should request recommendations', () => {

        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.recommendations('test', 'test2', 'test3');

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/recommendations?market=test&seed_artists=test2&seed_tracks=test3&min_energy=0.4&min_popularity=50&limit=0`, {
            headers
        });
    });

    it('should request user playlists', () => {
        const userId = 'user-id';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.userPlaylists(userId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/users/${userId}/playlists`, {
            headers
        });
    });

    it('should request create new playlist', () => {
        const userId = 'user-id';
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
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
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
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.myPlaylists(offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/playlists?offset=${offset}&limit=${limit}`, {
            headers: {
                ...headers,
            },
        });
    });

    each([
        ['track-id', ['track-id']],
        [['track-id', 'track-id2'], ['track-id', 'track-id2']]
    ]).it('should request add track to playlist', (trackId, expectedUris) => {
        const playlistId = 'playlist-id';
        const method = 'POST';
        const body = {
            uris: expectedUris
        };
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
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
        ['track-id', ['track-id']],
        [['track-id', 'track-id2'], ['track-id', 'track-id2']]
    ]).it('should request remove track to playlist', (trackId, expectedUris) => {
        const playlistId = 'playlist-id';
        const method = 'DELETE';
        const body = {
            uris: expectedUris
        };
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
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
        const playlistId = 'playlist-id';
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.getPlaylistDetails(playlistId);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/${playlistId}`, {
            headers
        });
    });

    it('should request playlist tracks', () => {
        const playlistId = 'playlist-id';
        const offset = 3;
        const limit = 14;
        jest.spyOn(spotifyMediaAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: () => jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        spotifyMediaAdapter.listPlaylistTracks(playlistId, offset, limit);

        expect(spotifyMediaAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/playlists/playlist-id/tracks?offset=${offset}&limit=${limit}`, {
            headers: {
                ...headers,
            },
        });
    });
});
