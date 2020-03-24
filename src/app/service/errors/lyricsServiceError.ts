import { LyricsServiceResult } from '../results/lyricsServiceResult';


class LyricsServiceError extends Error {

    static create<T>(message: string, details = {}) {
        return LyricsServiceResult.error<T, LyricsServiceError>(new LyricsServiceError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'LyricsServiceError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, LyricsServiceError.prototype);
    }
}

export { LyricsServiceError };
