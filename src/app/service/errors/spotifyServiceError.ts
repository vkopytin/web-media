import { SpotifyServiceResult } from '../results/spotifyServiceResult';


class SpotifyServiceError extends Error {

    static create<T>(message: string, details = {}) {
        return SpotifyServiceResult.error<T, SpotifyServiceError>(new SpotifyServiceError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'SpotifyServiceError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyServiceError.prototype);
    }
}

export { SpotifyServiceError };
