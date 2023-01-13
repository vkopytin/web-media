import { SpotifyPlayerServiceResult } from '../results/spotifyPlayerServiceResult';


class SpotifyPlayerServiceError extends Error {

    static create(message: string, details = {}) {
        return SpotifyPlayerServiceResult.error(new SpotifyPlayerServiceError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SpotifyPlayerServiceError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyPlayerServiceError.prototype);
    }
}

export { SpotifyPlayerServiceError };
