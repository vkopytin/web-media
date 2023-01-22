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

export interface IAuthInfo {
    access_token: string;
    state: string;
    code?: string;
}

const fromEntries = <T,>(str: string): T => {
    const obj = {} as { [key: string]: string };
    str.replace(/([^=&]+)=([^&]*)/g, (m: unknown, key: string, value: string) => {
        return obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return obj as T;
};

const getCookie = (key: string, defVal = ''): string => {
    if (typeof document === 'undefined') {
        return '';
    }
    const cookieRx = new RegExp('(^' + key + '|[^\\w\\d\\s]*' + key + ')[\\s]*=[\\s]*([^;]+)');
    if (!cookieRx.test(document.cookie)) {
        return defVal;
    }
    const [, , value] = cookieRx.exec(document.cookie) || [];

    return value;
}

class SettingsService {
    static makeDefaultSettings(): ISettings {
        if (typeof document === 'undefined' || typeof window === 'undefined') {
            return {
                lastSearch: {
                    val: ''
                },
                spotify: {
                    accessToken: '',
                    volume: 0
                },
                genius: {
                    accessToken: '',
                    code: ''
                },
                apiseeds: {
                    key: ''
                }
            };
        }
        const sToken = getCookie('spat');
        const gToken = getCookie('gsat');
        const gCode = getCookie('gcode');
        const lastSearch = getCookie('lastSearch', '');
        const apiseesKey = getCookie('apsk');
        const volume = +(getCookie('lastVolume') || 50);
        const urlParams = window.location.search.replace(/^\?/, '') || '';
        const hashData = window.location.hash.replace(/^#/, '') || '';
        const authInfo: IAuthInfo = fromEntries(hashData + '&' + urlParams);
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

    constructor(public config: ISettings = { lastSearch: { val: '' }, apiseeds: { key: '' }, genius: {}, spotify: {} }) {

    }

    volume(val?: number): number | undefined {
        if (arguments.length && val !== this.config.spotify.volume) {
            this.config.spotify.volume = val;
            document.cookie = `lastVolume=${val}`;
        }

        return this.config.spotify.volume;
    }

    apiseedsKey(val?: string): string {
        if (arguments.length && val && val !== this.config.apiseeds.key) {
            this.config.apiseeds.key = val;
            document.cookie = 'apsk=' + val;
        }

        return this.config.apiseeds.key;
    }

    get<K extends keyof SettingsService['config']>(
        propName: K
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
                document.cookie = 'spat=' + btoa((val as { accessToken: string }).accessToken);
            }
            if (propName === 'lastSearch') {
                document.cookie = 'lastSearch=' + btoa(((val as { val: string }).val));
            }
        }

        return Result.of(this.config[propName]);
    }

    refreshConfig(): void {
        const config = SettingsService.makeDefaultSettings();
        this.config = {
            ...this.config,
            ...config,
        };
    }
}

export { SettingsService };
