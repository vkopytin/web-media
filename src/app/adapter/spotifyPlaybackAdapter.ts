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

    createPlayer(getOAuthToken: (cb: (t: string) => void) => void): Promise<SDKPlayer> {
        return new Promise<SDKPlayer>((resolve, reject) => {
            if (this.player = window?.Spotify?.inst) {
                resolve(this.player);
                return;
            }

            const name = process.env.PLAYER_NAME || 'Dev Player for Spotify';
            try {
                if (window.Spotify) {
                    const Spotify = window.Spotify;
                    const player = window.Spotify.inst = new Spotify.Player({
                        name,
                        getOAuthToken: getOAuthToken
                    });

                    return resolve(player);
                }
                window.onSpotifyWebPlaybackSDKReady = () => {
                    const Spotify = window.Spotify;
                    const player = window.Spotify.inst = new Spotify.Player({
                        name,
                        getOAuthToken: getOAuthToken
                    });

                    resolve(player);
                };

                if (!window.Spotify) {
                    const scriptTag = document.createElement('script');
                    scriptTag.src = 'https://sdk.scdn.co/spotify-player.js';

                    document.head.appendChild(scriptTag);
                }

                setTimeout(() => reject(new Error('[Spotify SDK] Player was not created within expected time range')), 5000);
            } catch (ex) {
                reject(ex as Error);
            }
        });
    }
}
