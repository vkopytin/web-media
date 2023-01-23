import { SpotifyPlaybackAdapter } from '../adapter/spotifyPlaybackAdapter';
import { Events } from '../events';
import { IWebPlaybackError, IWebPlaybackPlayer, IWebPlaybackState, SDKPlayer } from '../ports/iPlaybackPort';
import { Option } from '../utils/option';
import { Result } from '../utils/result';
import { SettingsService } from './settings';


export class PlaybackService extends Events {
    deviceId = '';
    public player?: SDKPlayer;

    onInitializationError = (error: IWebPlaybackError): void => {
        console.log('initializationErrpr', error);
        this.trigger('initializationErrpr', error);
    };
    onAuthenticationError = (error: IWebPlaybackError): void => {
        console.log('authenticationError', error);
        this.trigger('authenticationError', error);
    };
    onAccountError = (error: IWebPlaybackError): void => {
        console.log('accountError', error);
        this.trigger('accountError', error);
    };
    onPlaybackError = (error: IWebPlaybackError): void => {
        console.log('playbackError', error);
        this.trigger('playbackError', error);
    };
    onPlayerStateChanged = (state: IWebPlaybackState): void => {
        console.log('playerStateChanged', state);
        this.trigger('playerStateChanged', state);
    }
    onReady = (player: IWebPlaybackPlayer): void => {
        console.log('ready', player);
        this.trigger('ready', player);
    }
    onNotReady = (player: IWebPlaybackPlayer): void => {
        console.log('notReady', player);
        this.trigger('notReady', player);
    }

    constructor(private spotifyPlaybackAdapter: SpotifyPlaybackAdapter, private settingsService: SettingsService) {
        super();
    }

    async init(): Promise<void> {
        const getOAuthToken = async (cb: (t: string) => void) => {
            this.settingsService.get('spotify').map(spotifySettings => {
                console.log('[Spotify SDK] *** Requesting OAuth Token ***');
                const token = spotifySettings?.accessToken || '';
                cb(token);
            });
        };

        this.player = await this.spotifyPlaybackAdapter.createPlayer(getOAuthToken);

        await this.connect();
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
            console.log('[Spotify SDK] Successfully connected to Spotify!');
        }
        return Option.none();
    }

    async disconnect(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        // Error handling
        this.player.removeListener('initialization_error', this.onInitializationError);
        this.player.removeListener('authentication_error', this.onAuthenticationError);
        this.player.removeListener('account_error', this.onAccountError);
        this.player.removeListener('playback_error', this.onPlaybackError);

        // Playback status updates
        this.player.removeListener('player_state_changed', this.onPlayerStateChanged);

        // Ready
        this.player.removeListener('ready', this.onReady);

        // Not Ready
        this.player.removeListener('not_ready', this.onNotReady);

        const isDisconnected = await this.player.disconnect();
        if (isDisconnected) {
            console.log('[Spotify SDK] Disconnected from Spotify!');
        } else {
            console.log('[Spotify SDK] Error disconnecting from Spotify!');
        }

        return Option.none();
    }

    async refreshToken(): Promise<Option<Error>> {
        if (!this.player) {
            return Option.some(new Error('[Spotify SDK] Player is not initialized'));
        }
        const isDisconnected = await this.disconnect();
        const res = await isDisconnected.orElse(() => this.connect()).await();

        return res;
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
