import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SettingsServiceResult } from './results/settingsServiceResult';
import { SettingsServiceUnexpectedError } from './errors/settingsServiceUnexpectedError';


export interface ISettings {
    genius?: {
        accessToken?: string;
        code?: string;
    };
    spotify?: {
        accessToken?: string;
        volume?: number;
    };
    musixmatch?: {
        key: string;
    }
}
const fromEntries = str => {
    const obj = {};
    str.replace(/([^=&]+)=([^&]*)/g, function (m, key, value) {
        obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return obj;
};

const getCookie = key => {
    const cookieRx = new RegExp('(^' + key + '|[^\\w\\d\\s]*' + key + ')[\\s]*=[\\s]*([^;]+)');
    const [a, k, value] = cookieRx.exec(document.cookie) || [];

    return value;
}

class SettingsService extends BaseService {
    static async create(connection: Service) {
        try {
            let sToken = getCookie('spat');
            let gToken = getCookie('gsat');
            let gCode = getCookie('gcode');
            const musixmatchKey = getCookie('mxmk');
            const volume = +(getCookie('lastVolume') || 50);
            const urlParams = window.location.search.replace(/^\?/, '') || '';
            const hashData = window.location.hash.replace(/^#/, '') || '';
            const authInfo = fromEntries(hashData + '&' + urlParams) as {
                access_token: string;
                state: string;
                code?: string;
            };
            const defaultSettings: ISettings = {
                spotify: {
                    accessToken: sToken && atob(sToken),
                    volume: volume,
                },
                genius: {
                    accessToken: gToken && atob(gToken),
                    code: gCode && atob(gCode)
                },
                musixmatch: {
                    key: musixmatchKey
                }
            };

            if ('access_token' in authInfo && /onSpotify-1/.test(authInfo.state)) {
                document.cookie = 'spat=' + btoa(authInfo.access_token);
                defaultSettings.spotify.accessToken = authInfo.access_token;

                window.location.replace(window.location.pathname);
            }

            if ('code' in authInfo && /onGenius-1/.test(authInfo.state)) {
                document.cookie = 'gcode=' + btoa(authInfo.code);
                defaultSettings.genius.code = authInfo.code;
                window.location.replace(window.location.pathname);
            }

            return SettingsServiceResult.success(new SettingsService(defaultSettings));
        } catch (ex) {
            return SettingsServiceUnexpectedError.create('Unexpected settings fetch error', ex);
        }
    }

    config: ISettings = {};

    constructor(settings: ISettings = {}) {
        super();

        this.config = settings;
    }

    volume(val?) {
        if (arguments.length && val !== this.config.spotify.volume) {
            this.config.spotify.volume = val;
            document.cookie = 'lastVolume=' + val;
        }

        return this.config.spotify.volume;
    }

    musixmatchKey(val?: string) {
        if (arguments.length && val !== this.config.musixmatch.key) {
            this.config.musixmatch.key = val;
            document.cookie = 'mxmk=' + val;
        }

        return this.config.musixmatch.key;
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
