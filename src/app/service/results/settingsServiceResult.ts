import { ServiceResult } from '../../base/serviceResult';
import { SettingsService } from '../settings';


class SettingsServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E | null) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new SettingsServiceResult(val, null as Error | null);
    }

    static error<Y extends Error>(val: Y) {
        const error = new SettingsServiceResult(null as SettingsService | null, val);
        error.isError = true;

        return error;
    }
}

export { SettingsServiceResult };
