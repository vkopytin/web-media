import $ from 'jquery';
import { BaseService } from '../base/baseService';
import { SettingsService } from './settings';
import { Result } from '../utils/result';
import { Events } from '../events';


class LoginService extends Events {
    constructor(public settings: SettingsService) {
        super();
    }

    async getSpotifyAuthUrl(): Promise<Result<Error, string>> {
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

        return Result.of(authUrl);
    }

    async isLoggedIn(): Promise<Result<Error, boolean>> {
        const settingsResult = await this.settings.get('spotify');
        return settingsResult.map(settings => {
            if (!settings) {
                return false;
            }
            if ('accessToken' in settings) {
                return true;
            }
            return false;
        });
    }

    async getGeniusAuthUrl(): Promise<Result<Error, string>> {
        const clientId = 'xJvzKWkHgMgOVTEoh4H3Jp3hhkUtTP3q9lQIGEwEZbPjp1r6-3kk9JQ6HiBHPEUq';
        const redirectUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
            authUrl = 'https://api.genius.com/oauth/authorize?' + $.param({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: ['me'].join(' '),
                response_type: 'code',
                state: 'onGenius-1'
            });

        return Result.of(authUrl);
    }
}

export { LoginService };
