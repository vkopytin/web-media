import { Result } from '../../utils/result';
import { LyricsServiceResult } from '../results/lyricsServiceResult';


class LyricsServiceError extends Error {

    static create<T>(message: string, details = {}) {
        return LyricsServiceResult.error<T, LyricsServiceError>(new LyricsServiceError(message, details));
    }

    static of<T>(message: string, details = {}) {
        return Result.error<Error, T>(new LyricsServiceError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'LyricsServiceError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, LyricsServiceError.prototype);
    }
}

export { LyricsServiceError };
