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
    playback_id: string;
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

export type SDKPlayer = {
    new(...args: unknown[]): SDKPlayer;
    addListener(eventName: 'ready', cb?: (player: IWebPlaybackPlayer) => void): void;
    addListener(eventName: 'playback_error', cb?: (res: IWebPlaybackError) => void): void;
    addListener(eventName: 'player_state_changed', cb?: (res: IWebPlaybackState) => void): void;
    addListener(eventName: 'not_ready', cb?: (player: IWebPlaybackPlayer) => void): void;
    addListener(eventName: 'account_error', cb?: (res: IWebPlaybackError) => void): void;
    addListener(eventName: 'initialization_error', cb?: (res: IWebPlaybackError) => void): void;
    addListener(eventName: 'authentication_error', cb?: (res: IWebPlaybackError) => void): void;
    removeListener(eventName: 'ready', cb?: (player: IWebPlaybackPlayer) => void): void;
    removeListener(eventName: 'playback_error', cb?: (res: IWebPlaybackError) => void): void;
    removeListener(eventName: 'player_state_changed', cb?: (res: IWebPlaybackState) => void): void;
    removeListener(eventName: 'not_ready', cb?: (player: IWebPlaybackPlayer) => void): void;
    removeListener(eventName: 'account_error', cb?: (res: IWebPlaybackError) => void): void;
    removeListener(eventName: 'initialization_error', cb?: (res: IWebPlaybackError) => void): void;
    removeListener(eventName: 'authentication_error', cb?: (res: IWebPlaybackError) => void): void;
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
    disconnect(): Promise<number>;
    _options: {
        getOAuthToken(fn: (access_token: string) => void): void;
        id: string;
    };
}

export interface IPlaybackPort {
    createPlayer(getOAuthToken: (cb: (t: string) => void) => void): Promise<SDKPlayer>;
}
