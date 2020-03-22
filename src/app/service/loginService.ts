import { withEvents } from 'databindjs';
import $ from 'jquery';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { LoginServiceResult } from './results/loginServiceResult';


class LoginService extends withEvents(BaseService) {
    static async create(connection: Service) {
        return LoginServiceResult.success(new LoginService(connection));
    }

    constructor(public ss: Service) {
        super();
    }

    async getRefreshTokenUrl() {
        const redirectUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
            refreshTokenUrl = 'https://accounts.spotify.com/authorize?' + $.param({
                client_id: '963f916fa62c4186a4b8370e16eef658',
                redirect_uri: redirectUri,
                scope: [
                    'streaming', 'user-read-email', 'user-read-private',
                    'user-modify-playback-state', 'user-top-read', 'user-library-read',
                    'playlist-read-private'
                ].join(' '),
                response_type: 'token',
                state: 1
            });

        return LoginServiceResult.success(refreshTokenUrl);
    }

    async isLoggedIn() {
        const settingsResult = await this.ss.settings('spotify');
        if (!settingsResult.val) {
            return LoginServiceResult.success(false);
        }
        if ('accessToken' in settingsResult.val) {
            return LoginServiceResult.success(true);
        }
        return LoginServiceResult.success(false);
    }
}

export { LoginService };
