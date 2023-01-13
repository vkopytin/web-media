import { SettingsServiceResult } from '../results/settingsServiceResult';


class SettingsServiceUnexpectedError extends Error {

    static create(message: string, details = {}) {
        return SettingsServiceResult.error(new SettingsServiceUnexpectedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SettingsServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, SettingsServiceUnexpectedError.prototype);
    }
}

export { SettingsServiceUnexpectedError };
