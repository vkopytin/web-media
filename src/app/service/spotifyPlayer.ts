import { BaseService } from '../base/baseService';
import { Service } from './index';
import { ISettings, SettingsService } from './settings';
import { SpotifyPlayerServiceResult } from './results/spotifyPlayerServiceResult';
import { SpotifyPlayerServiceError } from './errors/spotifyPlayerServiceError';
import { SpotifyPlayerServiceUnexpectedError } from './errors/spotifyPlayerServiceUnexpectedError';
import { withEvents } from 'databindjs';
import { none, Option } from '../utils/option';
import { Result } from '../utils/result';


export interface IWebPlaybackPlayer {
    device_id: string;
}

export interface IWebPlaybackError {
    message: string;
}

export interface IWebPlaybackTrack {
    uri: string; // Spotify URI
    id: string;               // Spotify ID from URI (can be null)
    type: string;             // Content type: can be "track", "episode" or "ad"
    media_type: string;       // Type of file: can be "audio" or "video"
    name: string;         // Name of content
    is_playable: boolean;        // Flag indicating whether it can be played
    album: {
        uri: string; // Spotify Album URI
        name: string;
        images: Array<{
            url: string;
        }>
    };
    artists: Array<{
        uri: string;
        name: string;
    }>;
}

export interface IWebPlaybackState {
    context: {
        uri: string; // The URI of the context (can be null)
        metadata: {
            context_description?: string;
        };             // Additional metadata for the context (can be null)
    };
    disallows: {                // A simplified set of restriction controls for
        pausing: boolean;           // The current track. By default, these fields
        peeking_next: boolean;      // will either be set to false or undefined, which
        peeking_prev: boolean;      // indicates that the particular operation is
        resuming: boolean;          // allowed. When the field is set to `true`, this
        seeking: boolean;           // means that the operation is not permitted. For
        skipping_next: boolean;     // example, `skipping_next`, `skipping_prev` and
        skipping_prev: boolean;      // `seeking` will be set to `true` when playing an
        // ad track.
    };
    bitrate: number;
    paused: boolean;  // Whether the current track is paused.
    position: number;    // The position_ms of the current track.
    duration: number;
    repeat_mode: number; // The repeat mode. No repeat mode is 0,
    timestamp: number;
    // once-repeat is 1 and full repeat is 2.
    shuffle: boolean; // True if shuffled, false otherwise.
    track_window: {
        current_track: IWebPlaybackTrack | null;                        // The track currently on local playback
        previous_tracks: Array<IWebPlaybackTrack>; // Previously played tracks. Number can vary.
        next_tracks: Array<IWebPlaybackTrack>;     // Tracks queued next. Number can vary.
    };
}

interface IPlayer {
    new(...args: unknown[]): IPlayer;
    addListener(eventName: 'ready', cb?: (player: IWebPlaybackPlayer) => void): void;
    addListener(eventName: 'playback_error', cb?: (res: IWebPlaybackError) => void): void;
    addListener(eventName: 'player_state_changed', cb?: (res: IWebPlaybackState) => void): void;
    addListener(eventName: 'not_ready', cb?: (player: IWebPlaybackPlayer) => void): void;
    addListener(eventName: 'account_error', cb?: (res: IWebPlaybackError) => void): void;
    addListener(eventName: 'initialization_error', cb?: (res: IWebPlaybackError) => void): void;
    addListener(eventName: 'authentication_error', cb?: (res: IWebPlaybackError) => void): void;
    togglePlay(): Promise<void>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(number: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    seek(number: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    connect(): Promise<boolean>;
    getCurrentState(): Promise<IWebPlaybackState>;
    disconnect(): void;
    _options: {
        getOAuthToken(fn: (access_token: string) => void): void;
        id: string;
    };
};

declare global {
    interface Window {
        Spotify: {
            Player: IPlayer
        };
        onSpotifyWebPlaybackSDKReady(): void;
    }
}

class SpotifyPlayerService extends withEvents(BaseService) {
    public player?: IPlayer;

    deviceId: string = '';
    onInitializationError = (error: IWebPlaybackError) => {
        console.log('initializationErrpr', error);
        this.trigger('initializationErrpr', error);
    };
    onAuthenticationError = (error: IWebPlaybackError) => {
        console.log('authenticationError', error);
        this.trigger('authenticationError', error);
    };
    onAccountError = (error: IWebPlaybackError) => {
        console.log('accountError', error);
        this.trigger('accountError', error);
    };
    onPlaybackError = (error: IWebPlaybackError) => {
        console.log('playbackError', error);
        this.trigger('playbackError', error);
    };
    onPlayerStateChanged = (state: IWebPlaybackState) => {
        console.log('playerStateChanged', state);
        this.trigger('playerStateChanged', state);
    }
    onReady = (player: IWebPlaybackPlayer) => {
        console.log('ready', player);
        this.trigger('ready', player);
    }
    onNotReady = (player: IWebPlaybackPlayer) => {
        console.log('notReady', player);
        this.trigger('notReady', player);
    }

    constructor(private settingsService: SettingsService) {
        super();
    }

    async init() {
        const getOAuthToken = async (cb: (t: string) => void) => {
            this.settingsService.get('spotify').map(spotifySettings => {
                console.log('[Spotify SDK] *** Requesting OAuth Token ***');
                const token = spotifySettings?.accessToken || '';
                cb(token);
            });
        };
        const name = process.env.PLAYER_NAME || 'Dev Player for Spotify';
        this.player = await new Promise((resolve, reject) => {
            try {
                if (window.Spotify) {
                    const Spotify = window.Spotify;
                    const player = new Spotify.Player({
                        name,
                        getOAuthToken: getOAuthToken
                    });

                    return resolve(player);
                }
                window.onSpotifyWebPlaybackSDKReady = () => {
                    const Spotify = window.Spotify;
                    const player = new Spotify.Player({
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

                setTimeout(() => reject(new Error('[Spotify SDK] Player was not created withiin expected time range')), 5000);
            } catch (ex) {
                reject(ex as Error);
            }
        });

        this.connect();
    }

    async connect(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        // Error handling
        this.player.addListener('initialization_error', this.onInitializationError);
        this.player.addListener('authentication_error', this.onAuthenticationError);
        this.player.addListener('account_error', this.onAccountError);
        this.player.addListener('playback_error', this.onPlaybackError);

        // Playback status updates
        this.player.addListener('player_state_changed', this.onPlayerStateChanged);

        // Ready
        this.player.addListener('ready', this.onReady);

        // Not Ready
        this.player.addListener('not_ready', this.onNotReady);

        // Connect to the player!
        const success = await this.player.connect();
        if (success) {
            console.log('The Web Playback SDK successfully connected to Spotify!');
        }
        return Option.none();
    }

    async refreshToken(newToken: string): Promise<Result<Error, boolean>> {
        if (!this.player) {
            return Result.error(new Error('[Spotify SDK] Player is not initialized'));
        }
        const res = await this.player.connect();
        if (res) {
            console.log('The Web Playback SDK successfully connected to Spotify!');
        } else {
            console.log('The Web Playback SDK failed to connect to Spotify!');
        }

        return Result.of(res);
    }

    async resume(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        await this.player.resume();

        return Option.none();
    }

    async togglePlay(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        await this.player.togglePlay();

        return Option.none();
    }

    async pause(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        await this.player.pause();

        return Option.none();
    }

    async nextTrack(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        await this.player.nextTrack();

        return Option.none();
    }

    async previouseTrack(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        await this.player.previousTrack();

        return Option.none();
    }

    async getCurrentState(): Promise<Result<Error, IWebPlaybackState>> {
        if (!this.player) {
            return Result.error(new Error('[Spotify SDK] Player is not initialized'));
        }
        const state = await this.player.getCurrentState();
        return Result.of(state);
    }

    async getVolume(): Promise<Result<Error, number>> {
        if (!this.player) {
            return Result.error(new Error('[Spotify SDK] Player is not initialized'));
        }
        const volume = await this.player.getVolume();
        return Result.of(volume * 100);
    }

    async setVolume(percent: number): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        await this.player.setVolume(percent * 0.01);

        return Option.none();
    }
}

export { SpotifyPlayerService };
