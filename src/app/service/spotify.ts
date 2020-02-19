import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import * as $ from 'jquery';
import { SoptifyAdapter, IUserInfo } from './adapter/spotify';
import { ISettings } from './settings';


class SpotifyService extends BaseService {
    static async create(connection: Service) {
        try {
            const settingsResult = await connection.settings('spotify');
            if (settingsResult.isError) {

                return settingsResult;
            }
            const spotifySettgins = settingsResult.val as ISettings['spotify'];
            const adapter = new SoptifyAdapter(spotifySettgins.accessToken);

            return SpotifyServiceResult.success(new SpotifyService(adapter));

        } catch (ex) {

            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify service', ex);
        }
    }

    currentProfile: IUserInfo = null;

    constructor(public adapter: SoptifyAdapter) {
        super();
    }

    async profile() {
        try {
            const res = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async isLoggedIn() {
        try {
            const profile = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(!!profile);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify service', ex);
        }
    }

    async recentlyPlayed() {
        try {
            const res = await this.adapter.recentlyPlayed();

            return SpotifyServiceResult.success(res.items);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listDevices() {
        try {
            const res = await this.adapter.devices();

            return SpotifyServiceResult.success(res.devices);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listRecommendations() {
        try {
            const res = await this.adapter.recommendations('US', '4NHQUGzhtTLFvgF5SZesLK', '0c6xIDDpzE81m2q797ordA', 0.4, 50);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async userPlaylists(user: IUserInfo) {
        try {
            const res = await this.adapter.userPlaylists(user.id);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async myPlaylists() {
        try {
            const res = await this.adapter.myPlaylists();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listTracks(playlistId) {
        try {
            const res = await this.adapter.listTracks(playlistId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async playTrack(deviceId, playlistUri, trackUri) {
        try {
            const res = await this.adapter.playTrack(deviceId, playlistUri, trackUri);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return SpotifyServiceUnexpectedError.create('Unexpected error on requesting sptify recently played', ex);
        }
    }
}

export { SpotifyService };
