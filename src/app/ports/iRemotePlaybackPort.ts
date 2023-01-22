import { IResponseResult, ISpotifySong, ITrack } from './iMediaProt';


export interface IDevicesResponse {
    devices: IDevice[];
}

export interface IDevice {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

export interface IPlayerResult {
    device: IDevice;
    shuffle_state: boolean;
    repeat_state: 'off' | string;
    timestamp: number;
    context: unknown;
    progress_ms: number;
    item: ITrack;
    currently_playing_type: 'track' | string;
    actions: {
        disallows: {
            resuming: boolean;
        }
    };
    is_playing: boolean;
}

export interface ICurrentlyPlayingResult {
    timestamp: number;
    context: unknown;
    progress_ms: number;
    item: ITrack;
    currently_playing_type: 'track' | string;
    actions: {
        disallows: {
            resuming: boolean;
        }
    };
    is_playing: boolean;
}

export interface IPLayerQueueResult {
    currently_playing: unknown;
    queue: ITrack[];
}

export interface IRemotePlaybackPort {
    token: string;
    seek(positionMs: number, deviceId?: string): Promise<void>;
    play(tracksUriList?: string | string[], indexOrUri?: number | string, deviceId?: string): Promise<void>;
    pause(deviceId: string): Promise<unknown>;
    next(deviceId?: string): Promise<unknown>;
    previous(deviceId?: string): Promise<unknown>;
    volume(precent: number, deviceId?: string): Promise<IResponseResult<ISpotifySong>>;
    currentlyPlaying(): Promise<ICurrentlyPlayingResult>;
    player(deviceId?: string, play?: boolean | null): Promise<IPlayerResult>;
    devices(): Promise<IDevicesResponse>;
    recentlyPlayed(before?: Date | number, limit?: number): Promise<IResponseResult<ISpotifySong>>;
    queue(): Promise<IPLayerQueueResult>;
}
