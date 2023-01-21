import { Result } from '../../utils/result';

class LyricsServiceUnexpectedError extends Error {

    static of<T>(message: string, details = {}) {
        return Result.error<Error, T>(new LyricsServiceUnexpectedError(message, details));
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
