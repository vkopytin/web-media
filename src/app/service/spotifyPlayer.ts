import { BaseService } from '../base/baseService';
import { Service } from './index';
import { ISettings } from './settings';
import { SpotifyPlayerServiceResult } from './results/spotifyPlayerServiceResult';
import { SpotifyPlayerServiceUnexpectedError } from './errors/spotifyPlayerServiceUnexpectedError';
import { withEvents } from 'databindjs';


interface IWebPlaybackPlayer {
    device_id: string;
}

interface IWebPlaybackError {
    message: string;
}

interface IWebPlaybackTrack {
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

interface IWebPlaybackState {
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
    paused: boolean;  // Whether the current track is paused.
    position: number;    // The position_ms of the current track.
    repeat_mode: number; // The repeat mode. No repeat mode is 0,
    // once-repeat is 1 and full repeat is 2.
    shuffle: boolean; // True if shuffled, false otherwise.
    track_window: {
        current_track: IWebPlaybackTrack;                        // The track currently on local playback
        previous_tracks: Array<IWebPlaybackTrack>; // Previously played tracks. Number can vary.
        next_tracks: Array<IWebPlaybackTrack>;     // Tracks queued next. Number can vary.
    };
}

interface IPlayer {
    new(...args): IPlayer;
    addListener(eventName: 'ready', cb?: (player: IWebPlaybackPlayer) => void);
    addListener(eventName: 'playback_error', cb?: (res: IWebPlaybackError) => void);
    addListener(eventName: 'player_state_changed', cb?: (res: IWebPlaybackState) => void);
    addListener(eventName: 'not_ready', cb?: (player: IWebPlaybackPlayer) => void);
    addListener(eventName: 'account_error', cb?: (res: IWebPlaybackError) => void);
    addListener(eventName: 'initialization_error', cb?: (res: IWebPlaybackError) => void);
    addListener(eventName: 'authentication_error', cb?: (res: IWebPlaybackError) => void);
    togglePlay(): Promise<void>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    seek(number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    connect(): Promise<(success) => void>;
    getCurrentState(): Promise<any>;
    disconnect();
    _options: {
        getOAuthToken(fn: (access_token) => void);
        id: string;
    };
};

declare global {
    interface Window {
        Spotify: {
            Player: IPlayer
        };
    }
}


class SpotifyPlayerService extends withEvents(BaseService) {
    static async create(connection: Service) {
        const settingsResult = await connection.settings('spotify');
        const name = 'Media Player for Spotify';
        if (settingsResult.isError) {

            return settingsResult;
        }

        const spotifySettings = settingsResult.val as ISettings['spotify'];

        try {
            if (window.Spotify) {
                const Spotify = window.Spotify;
                const player = new Spotify.Player({
                    name,
                    getOAuthToken: cb => {
                        const token = spotifySettings.accessToken;
                        cb(token);
                    }
                });

                return SpotifyPlayerServiceResult.success(new SpotifyPlayerService(player));
            }

            return new Promise<SpotifyPlayerServiceResult<SpotifyPlayerService, Error>>((resolve, reject) => {

                (window as any).onSpotifyWebPlaybackSDKReady = () => {
                    const Spotify = window.Spotify;
                    const player = new Spotify.Player({
                        name,
                        getOAuthToken: async cb => {
                            const token = spotifySettings.accessToken;
                            cb(token);
                        }
                    });

                    resolve(SpotifyPlayerServiceResult.success(new SpotifyPlayerService(player)));
                };
          
                if (!window.Spotify) {
                    const scriptTag = document.createElement('script');
                    scriptTag.src = 'https://sdk.scdn.co/spotify-player.js';
          
                    document.head!.appendChild(scriptTag);
                }

                setTimeout(() => reject(SpotifyPlayerServiceUnexpectedError.create('Player was not created withiin expected time range', new Error('Player was not created withiin expected time range'))), 5000);
            });
        } catch (ex) {

            return SpotifyPlayerServiceUnexpectedError.create('Unexpected error while creating spotify player', ex);
        }
    }

    deviceId: string = '';
    onInitializationError = (error: IWebPlaybackError) => {
        this.trigger('initializationErrpr', error);
    };
    onAuthenticationError = (error: IWebPlaybackError) => {
        this.trigger('authenticationError', error);
    };
    onAccountError = (error: IWebPlaybackError) => {
        this.trigger('accountError', error);
    };
    onPlaybackError = (error: IWebPlaybackError) => {
        this.trigger('playbackError', error);
    };
    onPlayerStateChanged = (state: IWebPlaybackState) => {
        this.trigger('playerStateChanged', state);
    }
    onReady = (player: IWebPlaybackPlayer) => {
        this.deviceId = player.device_id;
        this.trigger('ready', player);
    }
    onNotReady =  (player: IWebPlaybackPlayer) => {
        this.trigger('notReady', player);
    }

    constructor(public player: IPlayer) {
        super();

        setTimeout(() => {
            this.connect();
        });
    }

    async connect() {
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
    }

    resume() {
        this.player.resume();
    }

    togglePlay() {
        this.player.togglePlay();
    }

    pause() {
        this.player.pause();
    }

    nextTrack() {
        this.player.nextTrack();
    }

    previouseTrack() {
        this.player.previousTrack();
    }

    async volumeUp() {
        const volume = await this.player.getVolume();
        this.player.setVolume(volume * 1.1);
    }

    async volumeDown() {
        const volume = await this.player.getVolume();

        this.player.setVolume(volume * 0.9);
    }
}

export { SpotifyPlayerService };