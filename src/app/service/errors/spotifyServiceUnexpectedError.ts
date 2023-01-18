import { ServiceResult } from '../../base/serviceResult';
import { Result } from '../../utils/result';
import { SpotifyServiceResult } from '../results/spotifyServiceResult';


class SpotifyServiceUnexpectedError extends Error {

    static create<T>(message: string, details = {}): ServiceResult<T, Error> {
        return SpotifyServiceResult.error<T, SpotifyServiceUnexpectedError>(new SpotifyServiceUnexpectedError(message, details));
    }

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new SpotifyServiceUnexpectedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SpotifyServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyServiceUnexpectedError.prototype);
    }
}

export { SpotifyServiceUnexpectedError };
