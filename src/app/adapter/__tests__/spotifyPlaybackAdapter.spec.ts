/* eslint-disable */

import { SpotifyPlaybackAdapter } from '../spotifyPlaybackAdapter';

describe('Spotify Playback Adapter', () => {
    let spotifyPlaybackAdapter: SpotifyPlaybackAdapter;
    let theWindow: {
        Spotify?: { Player: Function };
        onSpotifyWebPlaybackSDKReady: Function;
        setTimeout: Function;
    } = {
        onSpotifyWebPlaybackSDKReady() {

        },
        setTimeout: () => { },
    };
    let theDocument = {
        createElement: () => ({}),
        head: {
            appendChild() { },
        },
    };

    beforeEach(() => {
        spotifyPlaybackAdapter = new SpotifyPlaybackAdapter(theWindow as any, theDocument as any);
    });

    it('should create SDK player instance', async () => {
        jest.spyOn(theDocument, 'createElement').mockImplementation(() => {
            theWindow.Spotify = {
                Player: function () { }
            };
            return {};
        });
        jest.spyOn(theDocument.head, 'appendChild').mockImplementation(() => theWindow.onSpotifyWebPlaybackSDKReady());

        const player = await spotifyPlaybackAdapter.createPlayer(() => { });
        const samePlayer = await spotifyPlaybackAdapter.createPlayer(() => { });

        expect(player).toBeDefined();
        expect(player).toBe(samePlayer);
    });
});
