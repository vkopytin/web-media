import { Result } from '../../utils/result';
import { SpotifyPlayerServiceResult } from '../results/spotifyPlayerServiceResult';


class SpotifyPlayerServiceUnexpectedError extends Error {

    static create(message: string, details = {}) {
        return SpotifyPlayerServiceResult.error(new SpotifyPlayerServiceUnexpectedError(message, details));
    }

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new SpotifyPlayerServiceUnexpectedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SpotifyPlayerServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyPlayerServiceUnexpectedError.prototype);
    }
}

export { SpotifyPlayerServiceUnexpectedError };
