import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SettingsServiceResult } from './results/settingsServiceResult';
import { SettingsServiceUnexpectedError } from './errors/settingsServiceUnexpectedError';


export interface ISettings {
    spotify?: {
        accessToken?: string;
        volume?: number;
    };
}
const fromEntries = str => {
    const obj = {};
    str.replace(/([^=&]+)=([^&]*)/g, function (m, key, value) {
        obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return obj;
};

const getCookie = key => {
    const cookieRx = new RegExp('(^' + key + '|[^\\w\\d\\s]*' + key + ')[\\s]*=[\\s]*([^;]+[^\\d\\w\\s]|[^;]+$)');
    const [a, k, value] = cookieRx.exec(document.cookie) || [];

    return value;
}

class SettingsService extends BaseService {
    static async create(connection: Service) {
        try {
            let token = getCookie('access_token');
            const volume = getCookie('lastVolume') || 50;
            const authData = window.location.hash.replace(/^#/, ''),
                authInfo = fromEntries(authData) as {
                    access_token: string;
                };

            if ('access_token' in authInfo) {
                document.cookie = 'access_token=' + btoa(authInfo.access_token);
                token = btoa(authInfo.access_token);

                window.location.replace(window.location.pathname);

                return SettingsServiceResult.success(new SettingsService({
                    spotify: {
                        accessToken: atob(token),
                        volume: volume
                    }
                }));
            }

            if (token) {
                return SettingsServiceResult.success(new SettingsService({
                    spotify: {
                        accessToken: atob(token),
                        volume: volume
                    }
                }));
            }

            return SettingsServiceResult.success(new SettingsService({
                volume: volume
            }));
        } catch (ex) {
            return SettingsServiceUnexpectedError.create('Unexpected settings fetch error', ex);
        }
    }

    config: ISettings = {};

    constructor(settings: {} = {}) {
        super();

        this.config = settings;
    }

    volume(val?) {
        if (arguments.length && val !== this.config.spotify.volume) {
            this.config.spotify.volume = val;
            document.cookie += 'lastVolume=' + val;
        }

        return this.config.spotify.volume;
    }

    get<K extends keyof SettingsService['config']>(
        propName: K, val?: SettingsService['config'][K]
    ): SettingsServiceResult<SettingsService['config'][K], Error> {

        return SettingsServiceResult.success(this.config[propName]);
    }

    set<K extends keyof SettingsService['config']>(
        propName: K, val: SettingsService['config'][K]
    ): SettingsServiceResult<SettingsService['config'][K], Error> {
        if (val !== this.config[propName]) {
            this.config[propName] = {
                ...this.config[propName],
                ...val
            };
        }

        return SettingsServiceResult.success(this.config[propName]);
    }
}

export { SettingsService };
