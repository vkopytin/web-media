import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import * as $ from 'jquery';
import { SoptifyAdapter } from './adapter/spotify';


export interface IUserInfo {
    birthdate?: string;
    country?: 'PL' | string;
    display_name?: string;
    email?: string;
    explicit_content?: {
        filter_enabled?: boolean;
        filter_locked?: boolean;
    };
    external_urls?: {
        spotify?: string;
    };
    followers?: {
        href?: string;
        total?: number;
    };
    href?: string;
    id?: string;
    images?: Array<any>;
    product?: 'open' | string;
    type?: 'user' | string;
    uri?: string;
};

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

class SpotifyService extends BaseService {
    userInfo?: IUserInfo;

    static async create(connection: Service) {
        try {
            const settingsResult = await connection.settings('spotify');
            if (settingsResult.isError) {

                return settingsResult;
            }

            let token = getCookie('access_token');
            const authData = window.location.hash.replace(/^#/, ''),
                authInfo = fromEntries(authData) as {
                    access_token: string;
                };

            if ('access_token' in authInfo) {
                document.cookie = 'access_token=' + btoa(authInfo.access_token);
                token = btoa(authInfo.access_token);

                return window.location.replace(window.location.pathname);
            }
            if (token) {
                const adapter = new SoptifyAdapter(atob(token));
                const profile = await adapter.me();
    
                return SpotifyServiceResult.success(new SpotifyService(profile));
            }

            return SpotifyServiceUnexpectedError.create('Error: Not loged in');
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify service', ex);
        }
    }

    constructor(userInfo) {
        super();
    }
}

export { SpotifyService };
