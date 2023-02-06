import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { Events } from '../events';
import { IResponseResult, ISpotifySong } from '../ports/iMediaProt';
import { ICurrentlyPlayingResult, IDevice, IPlayerResult, IRemotePlaybackPort } from '../ports/iRemotePlaybackPort';
import { asyncDebounce } from '../utils';
import { Result } from '../utils/result';
import { NoActiveDeviceError } from './errors/noActiveDeviceError';
import { RemotePlaybackServiceError } from './errors/remotePlaybackServiceError';
import { RemotePlaybackServiceUnexpectedError } from './errors/remotePlaybackServiceUnexpectedError';
import { TokenExpiredError } from './errors/tokenExpiredError';
import { UnauthenticatedError } from './errors/unauthenticatedError';


function returnErrorResult<T>(message: string, err: Error): Result<Error, T> {
    if (err instanceof ErrorWithStatus) {
        if (err.status === 401 && /expired/i.test(err.message)) {
            return TokenExpiredError.of(err.message, err);
        } else if (err.status === 404 && /active device/i.test(err.message)) {
            return NoActiveDeviceError.of(err.message, err);
        } if (err.status === 400 && /bearer authentication/i.test(err.message)) {
            return UnauthenticatedError.of(err.message, err);
        }

        return RemotePlaybackServiceError.of<T>(err.message, err);
    }

    return RemotePlaybackServiceUnexpectedError.of<T>(message, err);
}

export class RemotePlaybackService extends Events {
    onStateChanged = asyncDebounce((...args: Array<unknown>) => this.onStateChangedInternal(...args), 500);

    constructor(public playbackport: IRemotePlaybackPort) {
        super();
    }

    refreshToken(newToken: string): Result<Error, boolean> {
        this.playbackport.token = newToken;
        return Result.of(true);
    }

    onStateChangedInternal(...args: Array<unknown>): void {
        this.trigger('change:state', ...args);
    }

    async seek(positionMs: number, deviceId = ''): Promise<Result<Error, void>> {
        try {
            const res = await this.playbackport.seek(Math.round(positionMs), deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult<void>('Unexpected error on requesting spotify seek', ex as Error);
        }
    }

    async play(deviceId?: string, tracksUriList?: string | string[], indexOrUri: number | string = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.playbackport.play(tracksUriList, indexOrUri, deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify play', ex as Error);
        }
    }

    async pause(deviceId = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.playbackport.pause(deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify pause', ex as Error);
        }
    }

    async next(deviceId = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.playbackport.next(deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify next', ex as Error);
        }
    }

    async previous(deviceId = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.playbackport.previous(deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify previous', ex as Error);
        }
    }

    async volume(percent: number): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.playbackport.volume(Math.round(percent));

            this.onStateChanged(res);
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify volume', ex as Error);
        }
    }

    async recentlyPlayed(): Promise<Result<Error, ISpotifySong[]>> {
        try {
            const res = await this.playbackport.recentlyPlayed();

            return Result.of(res.items);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify recently played', ex as Error);
        }
    }

    async listDevices(): Promise<Result<Error, IDevice[]>> {
        try {
            const res = await this.playbackport.devices();

            return Result.of(res.devices);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify list devices', ex as Error);
        }
    }

    async player(deviceId = '', play: boolean | null = null): Promise<Result<Error, IPlayerResult>> {
        try {
            const res = await this.playbackport.player(deviceId, play);

            play !== null && this.onStateChanged(res);
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify player', ex as Error);
        }
    }

    async currentlyPlaying(): Promise<Result<Error, ICurrentlyPlayingResult>> {
        try {
            const res = await this.playbackport.currentlyPlaying();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify currently playing', ex as Error);
        }
    }

}
