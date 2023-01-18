import { BaseService } from '../base/baseService';
import { SettingsServiceUnexpectedError } from './errors/settingsServiceUnexpectedError';
import { Result } from '../utils/result';


export interface ISettings {
    lastSearch: {
        val: string
    },
    genius: {
        accessToken?: string;
        code?: string;
    };
    spotify: {
        accessToken?: string;
        volume?: number;
    };
    apiseeds: {
        key: string;
    }
}
const fromEntries = (str: string) => {
    const obj = {} as { [key: string]: string };
    str.replace(/([^=&]+)=([^&]*)/g, (m: unknown, key: string, value: string) => {
        return obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return obj;
};

const getCookie = (key: string, defVal = '') => {
    const cookieRx = new RegExp('(^' + key + '|[^\\w\\d\\s]*' + key + ')[\\s]*=[\\s]*([^;]+)');
    const [a, k, value] = cookieRx.exec(document.cookie) || [];

    return value;
}

class SettingsService extends BaseService {
    static makeDefaultSettings() {
        let sToken = getCookie('spat');
        let gToken = getCookie('gsat');
        let gCode = getCookie('gcode');
        const lastSearch = getCookie('lastSearch', '');
        const apiseesKey = getCookie('apsk');
        const volume = +(getCookie('lastVolume') || 50);
        const urlParams = window.location.search.replace(/^\?/, '') || '';
        const hashData = window.location.hash.replace(/^#/, '') || '';
        const authInfo = fromEntries(hashData + '&' + urlParams) as {
            access_token: string;
            state: string;
            code?: string;
        };
        const defaultSettings: ISettings = {
            lastSearch: {
                val: lastSearch && atob(lastSearch),
            },
            spotify: {
                accessToken: sToken && atob(sToken),
                volume: volume,
            },
            genius: {
                accessToken: gToken && atob(gToken),
                code: gCode && atob(gCode)
            },
            apiseeds: {
                key: apiseesKey
            }
        };

        if ('access_token' in authInfo && /onSpotify-1/.test(authInfo.state)) {
            document.cookie = 'spat=' + btoa(authInfo.access_token);
            defaultSettings.spotify.accessToken = authInfo.access_token;

            window.location.replace(window.location.pathname);
        }

        if ('code' in authInfo && /onGenius-1/.test(authInfo.state) && authInfo.code) {
            document.cookie = 'gcode=' + btoa(authInfo.code);
            defaultSettings.genius.code = authInfo.code;
            window.location.replace(window.location.pathname);
        }

        return defaultSettings;
    }

    config: ISettings = { lastSearch: { val: '' }, apiseeds: { key: '' }, genius: {}, spotify: {} };

    constructor(settings: ISettings = { lastSearch: { val: '' }, apiseeds: { key: '' }, genius: {}, spotify: {} }) {
        super();

        this.config = settings;
    }

    volume(val?: number) {
        if (arguments.length && val !== this.config.spotify.volume) {
            this.config.spotify.volume = val;
            document.cookie = `lastVolume=${val}`;
        }

        return this.config.spotify.volume;
    }

    apiseedsKey(val?: string) {
        if (arguments.length && val && val !== this.config.apiseeds.key) {
            this.config.apiseeds.key = val;
            document.cookie = 'apsk=' + val;
        }

        return this.config.apiseeds.key;
    }

    get<K extends keyof SettingsService['config']>(
        propName: K, val?: SettingsService['config'][K]
    ): Result<Error, SettingsService['config'][K]> {
        this.refreshConfig(); //toDO: Make something more specific. Like get already refreshed value individualy.

        return Result.of(this.config[propName]);
    }

    set<K extends keyof SettingsService['config']>(
        propName: K, val: SettingsService['config'][K]
    ): Result<Error, SettingsService['config'][K]> {
        if (val !== this.config[propName]) {
            this.config[propName] = {
                ...this.config[propName],
                ...val
            };
            if (propName === 'spotify' && 'accessToken' in val) {
                document.cookie = 'spat=' + btoa((val as any).accessToken);
            }
            if (propName === 'lastSearch') {
                document.cookie = 'lastSearch=' + btoa(((val as { val: string }).val));
            }
        }

        return Result.of(this.config[propName]);
    }

    refreshConfig() {
        const config = SettingsService.makeDefaultSettings();
        this.config = {
            ...this.config,
            ...config,
        };
    }
}

export { SettingsService };
