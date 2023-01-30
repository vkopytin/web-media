import { IPlaybackPort, SDKPlayer } from '../ports/iPlaybackPort';

declare global {
    interface Window {
        Spotify: {
            Player: SDKPlayer,
            inst: SDKPlayer,
        };
        onSpotifyWebPlaybackSDKReady(): void;
    }
}

export class SpotifyPlaybackAdapter implements IPlaybackPort {
    public player?: SDKPlayer;

    constructor(
        private window: Window = window,
        private document: Document = document,
    ) {

    }

    createPlayer(getOAuthToken: (cb: (t: string) => void) => void): Promise<SDKPlayer> {
        return new Promise<SDKPlayer>((resolve, reject) => {
            if (this.player = this.window?.Spotify?.inst) {
                resolve(this.player);
                return;
            }

            const name = process.env.PLAYER_NAME || 'Dev Player for Spotify';
            try {
                if (this.window.Spotify) {
                    const Spotify = this.window.Spotify;
                    const player = this.window.Spotify.inst = new Spotify.Player({
                        name,
                        getOAuthToken: getOAuthToken
                    });

                    return resolve(player);
                }
                this.window.onSpotifyWebPlaybackSDKReady = () => {
                    const Spotify = this.window.Spotify;
                    const player = this.window.Spotify.inst = new Spotify.Player({
                        name,
                        getOAuthToken: getOAuthToken
                    });

                    resolve(player);
                };

                if (!this.window.Spotify) {
                    const scriptTag = this.document.createElement('script');
                    scriptTag.src = 'https://sdk.scdn.co/spotify-player.js';

                    this.document.head.appendChild(scriptTag);
                }

                this.window.setTimeout(() => reject(new Error('[Spotify SDK] Player was not created within expected time range')), 5000);
            } catch (ex) {
                reject(ex as Error);
            }
        });
    }
}
