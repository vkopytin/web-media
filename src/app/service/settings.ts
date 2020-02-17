import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SettingsServiceResult } from './results/settingsServiceResult';
import { SettingsServiceUnexpectedError } from './errors/settingsServiceUnexpectedError';


class SettingsService extends BaseService {
    static async create(connection: Service) {
        try {
            return SettingsServiceResult.success(new SettingsService());
        } catch (ex) {
            return SettingsServiceUnexpectedError.create('Unexpected settings fetch error', ex);
        }
    }

    get(key) {
        return SettingsServiceResult.success({});
    }
}

export { SettingsService };
