import { SpotifyServiceResult } from '../results/spotifyServiceResult';


class NoActiveDeviceError extends Error {

    static create<T>(message: string, details = {}) {
        return SpotifyServiceResult.error<T, NoActiveDeviceError>(new NoActiveDeviceError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'NoActiveDeviceError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, NoActiveDeviceError.prototype);
    }
}

export { NoActiveDeviceError };
