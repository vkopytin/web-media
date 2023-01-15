import { withEvents } from 'databindjs';
import $ from 'jquery';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { LoginServiceResult } from './results/loginServiceResult';
import { SettingsService } from './settings';


class LoginService extends withEvents(BaseService) {
    constructor(public settings: SettingsService) {
        super();
    }

    async getSpotifyAuthUrl() {
        const clientId = '963f916fa62c4186a4b8370e16eef658';
        const redirectUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
            authUrl = 'https://accounts.spotify.com/authorize?' + $.param({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: [
                    // Images
                    'ugc-image-upload',
                    // Spotify Connect
                    'user-read-playback-state',
                    'user-modify-playback-state',
                    'user-read-currently-playing',
                    // Users
                    'user-read-private',
                    'user-read-email',
                    // Follow
                    'user-follow-modify',
                    'user-follow-read',
                    // Library
                    'user-library-modify',
                    'user-library-read',
                    // Playback
                    'streaming',
                    'app-remote-control',
                    // Listening History
                    'user-read-playback-position',
                    'user-top-read',
                    'user-read-recently-played',
                    // Playlists
                    'playlist-modify-private',
                    'playlist-read-collaborative',
                    'playlist-read-private',
                    'playlist-modify-public'
                ].join(' '),
                response_type: 'token',
                state: 'onSpotify-1'
            });

        return LoginServiceResult.success(authUrl);
    }

    async isLoggedIn() {
        const settingsResult = await this.settings.get('spotify');
        if (!settingsResult.val) {
            return LoginServiceResult.success(false);
        }
        if ('accessToken' in settingsResult.val) {
            return LoginServiceResult.success(true);
        }
        return LoginServiceResult.success(false);
    }

    async getGeniusAuthUrl() {
        const clientId = 'xJvzKWkHgMgOVTEoh4H3Jp3hhkUtTP3q9lQIGEwEZbPjp1r6-3kk9JQ6HiBHPEUq';
        const redirectUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
            authUrl = 'https://api.genius.com/oauth/authorize?' + $.param({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: ['me'].join(' '),
                response_type: 'code',
                state: 'onGenius-1'
            });

        return LoginServiceResult.success(authUrl);
    }
}

export { LoginService };
