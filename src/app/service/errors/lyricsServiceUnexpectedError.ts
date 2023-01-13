import { LyricsServiceResult } from '../results/lyricsServiceResult';


class LyricsServiceUnexpectedError extends Error {

    static create<T>(message: string, details = {}) {
        return LyricsServiceResult.error<T, LyricsServiceUnexpectedError>(new LyricsServiceUnexpectedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'LyricsServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, LyricsServiceUnexpectedError.prototype);
    }
}

export { LyricsServiceUnexpectedError };
