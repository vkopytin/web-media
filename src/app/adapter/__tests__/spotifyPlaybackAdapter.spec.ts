/* eslint-disable */

import { SpotifyPlaybackAdapter } from '../spotifyPlaybackAdapter';

describe('Spotify Playback Adapter', () => {
    let spotifyPlaybackAdapter: SpotifyPlaybackAdapter;
    let theWindow: {
        Spotify?: { Player: Function };
        onSpotifyWebPlaybackSDKReady: Function;
        setTimeout: Function;
    };
    let theDocument: {
        createElement: () => unknown,
        head: {
            appendChild(): void,
        },
    };

    beforeEach(() => {
        theWindow = makeSDKWindow();
        theDocument = makeDomDocument();
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

    it('should fail creating SDK player instance with load library error', async () => {
        try {
            jest.spyOn(theDocument, 'createElement').mockImplementation(() => {
                return {};
            });
            jest.spyOn(theDocument.head, 'appendChild').mockImplementation(() => theWindow.onSpotifyWebPlaybackSDKReady());

            await spotifyPlaybackAdapter.createPlayer(() => { });
        } catch (ex) {
            expect(ex).toEqual(new Error('[Spotify SDK] Player library has failed to load'));
        }
    });
});

function makeSDKWindow() {
    return {
        onSpotifyWebPlaybackSDKReady() {

        },
        setTimeout: () => { },
    };
}

function makeDomDocument() {
    return {
        createElement: () => ({}),
        head: {
            appendChild() { },
        },
    };
}