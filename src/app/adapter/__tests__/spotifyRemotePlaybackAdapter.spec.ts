/* eslint-disable */

import each from 'jest-each';
import { ErrorWithStatus } from '../errors/errorWithStatus';
import { SpotifyRemotePlaybackAdapter } from '../spotifyRemotePlaybackAdapter';

describe('Spotify Remote Playback Adapter', () => {
    let spotifyRemotePlaybackAdapter: SpotifyRemotePlaybackAdapter;
    let urlDomain = 'https://api.spotify.com';
    let token = 'test';
    let headers = {
        'Authorization': 'Bearer ' + token
    };

    beforeEach(() => {
        spotifyRemotePlaybackAdapter = new SpotifyRemotePlaybackAdapter(token);
    });

    it('should throw error with status 401 The access token expired message', async () => {
        const errorWithMessage = {
            error: {
                message: 'The access token expired',
            },
        };
        try {
            jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 401,
                text: jest.fn().mockImplementation(() => Promise.resolve(JSON.stringify(errorWithMessage))),
            } as any));

            await spotifyRemotePlaybackAdapter.recentlyPlayed();
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
            jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 503,
                text: jest.fn().mockImplementation(() => Promise.resolve(JSON.stringify(errorWithMessage))),
            } as any));

            await spotifyRemotePlaybackAdapter.recentlyPlayed();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('Service unavailable', 503, '503 error', ex));
        }
    });

    it('should throw some error', async () => {
        const errorWithMessage = {
            error: 'Some error',
        };
        try {
            jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 400,
                text: jest.fn().mockImplementation(() => Promise.resolve(JSON.stringify(errorWithMessage))),
            } as any));

            await spotifyRemotePlaybackAdapter.recentlyPlayed();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('Some error', 400, '400 error', ex));
        }
    });

    it('should throw unexpected error', async () => {
        const errorWithMessage = '{}';
        try {
            jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
                status: 400,
                text: jest.fn().mockImplementation(() => Promise.resolve(errorWithMessage)),
            } as any));

            await spotifyRemotePlaybackAdapter.recentlyPlayed();
        } catch (ex) {
            expect(ex).toEqual(new ErrorWithStatus('{}', 400, '400 error', ex));
        }
    });

    it('should request recently played', async () => {
        const before = +Date();
        const limit = 15;
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.recentlyPlayed(before, limit);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/recently-played?before=${before}&limit=${limit}`, {
            headers,
        });
    });

    it('should request devices', async () => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.devices();

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/devices`, {
            headers,
        });
    });

    each([
        ['', {}, undefined, undefined, undefined, undefined],
        ['', { context_uri: 'track-id-123' }, 'track-id-123', undefined, undefined],
        ['', { context_uri: 'playlist-id-123', offset: { position: 3 } }, 'playlist-id-123', 3, undefined],
        ['', { uris: ['track-id-123', 'track-id-456'] }, ['track-id-123', 'track-id-456'], undefined, undefined],
        ['', { uris: ['track-id-123', 'track-id-456'], offset: { uri: 'track-id-123' } }, ['track-id-123', 'track-id-456'], 'track-id-123', undefined],
        ['?device_id=device-id-123', { uris: ['track-id-123', 'track-id-456'], offset: { uri: 'track-id-123' } }, ['track-id-123', 'track-id-456'], 'track-id-123', 'device-id-123'],
    ]).it('should request play', async (expectedUrl, expectedBody, trackIds, indexOrUri, deviceId) => {
        const method = 'PUT';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.play(trackIds, indexOrUri, deviceId);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/play${expectedUrl}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expectedBody),
        });
    });

    each([
        ['', undefined],
        ['?device_id=device-id-123', 'device-id-123']
    ]).it('should request next playback', async (expected, deviceId) => {
        const method = 'POST';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.next(deviceId);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/next${expected}`, {
            method,
            headers,
        });
    });

    each([
        ['', undefined],
        ['?device_id=device-id-123', 'device-id-123']
    ]).it('should request previous playback', async (expected, deviceId) => {
        const method = 'POST';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.previous(deviceId);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/previous${expected}`, {
            method,
            headers,
        });
    });

    each([
        ['', undefined],
        ['?device_id=device-id-123', 'device-id-123']
    ]).it('should request pause playback', async (expected, deviceId) => {
        const method = 'PUT';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.pause(deviceId);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/pause${expected}`, {
            method,
            headers,
        });
    });

    it('should request read playback state', async () => {
        const method = 'GET';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.player();

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
        });
    });

    each([
        ['device-id-123', true],
        ['device-id-123', false]
    ]).it('should request read playback state', async (deviceId, startPlay) => {
        const method = 'PUT';
        const body = {
            device_ids: [deviceId],
            play: startPlay,
        };
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.player(deviceId, startPlay);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
    });

    each([
        ['position_ms=345', 345, undefined],
        ['position_ms=567&device_id=device-id-123', 567, 'device-id-123'],
    ]).it('should request seek playback', async (expected, positionMs, deviceId) => {
        const method = 'PUT';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.seek(positionMs, deviceId);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/seek?${expected}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: '{}'
        });
    });

    it('should request currently playing info', async () => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.currentlyPlaying();

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/currently-playing`, {
            headers,
        });
    });

    each([
        ['?volume_percent=55', 55, undefined],
        ['?volume_percent=77&device_id=device-id-123', 77, 'device-id-123'],
    ]).it('should request settings new volume', async (expected, percent, deviceId) => {
        const method = 'PUT';
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.volume(percent, deviceId);

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/volume${expected}`, {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: '{}'
        });
    });

    it('should request queue', async () => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'fetch').mockImplementation((a, b) => Promise.resolve({
            status: 200,
            text: jest.fn().mockImplementation(() => Promise.resolve('{}')),
        } as any));

        await spotifyRemotePlaybackAdapter.queue();

        expect(spotifyRemotePlaybackAdapter.fetch).toHaveBeenCalledWith(`${urlDomain}/v1/me/player/queue`, {
            headers,
        });
    });
});
