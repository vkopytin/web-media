import { IPlaybackPort, SDKPlayer } from '../ports/iPlaybackPort';

interface WindowExt {
    Spotify?: {
        Player?: SDKPlayer,
        inst?: SDKPlayer,
    };
    onSpotifyWebPlaybackSDKReady(): void;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends WindowExt {

    }
}

export class SpotifyPlaybackAdapter implements IPlaybackPort {
    public player?: SDKPlayer;

    constructor(
        private window = SpotifyPlaybackAdapter.resolveWindow(),
        private document: Document = SpotifyPlaybackAdapter.resolveDocument(),
    ) {

    }

    static resolveWindow() {
        return typeof window === 'object' ? window : {} as Window;
    }

    static resolveDocument() {
        return typeof document === 'object' ? document : {} as Document;
    }

    createPlayer(getOAuthToken: (cb: (t: string) => void) => void): Promise<SDKPlayer> {
        return new Promise<SDKPlayer>((resolve, reject) => {
            if (this.player = this.window?.Spotify?.inst) {
                resolve(this.player);
                return;
            }

            const name = process.env.PLAYER_NAME || 'Dev Player for Spotify';
            try {
                if (this.window.Spotify?.Player) {
                    const SDKPlayer = this.window.Spotify.Player;
                    const player = this.window.Spotify.inst = new SDKPlayer({
                        name,
                        getOAuthToken: getOAuthToken
                    });

                    return resolve(player);
                }

                this.window.onSpotifyWebPlaybackSDKReady = () => {
                    if (!this.window.Spotify || !this.window.Spotify?.Player) {
                        reject(new Error('[Spotify SDK] Player library has failed to load'));
                        return;
                    }
                    const SDKPlayer = this.window.Spotify?.Player;
                    const player = this.window.Spotify.inst = new SDKPlayer({
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
