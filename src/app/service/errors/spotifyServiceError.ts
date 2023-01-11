import { ServiceResult } from '../../base/serviceResult';
import { SpotifyServiceResult } from '../results/spotifyServiceResult';


class SpotifyServiceError extends Error {

    static create<T>(message: string, details = {}): ServiceResult<T, Error> {
        return SpotifyServiceResult.error<T, SpotifyServiceError>(new SpotifyServiceError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SpotifyServiceError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyServiceError.prototype);
    }
}

export { SpotifyServiceError };
