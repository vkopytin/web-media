import { SettingsServiceResult } from '../results/settingsServiceResult';


class SettingsServiceUnexpectedError extends Error {

    static create(message: string, details = {}) {
        return SettingsServiceResult.error(new SettingsServiceUnexpectedError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'SettingsServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, SettingsServiceUnexpectedError.prototype);
    }
}

export { SettingsServiceUnexpectedError };
