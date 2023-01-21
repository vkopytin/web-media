import { Result } from '../../utils/result';

class LyricsServiceError extends Error {

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
