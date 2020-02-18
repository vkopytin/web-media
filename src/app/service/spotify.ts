import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import * as $ from 'jquery';
import { SoptifyAdapter } from './adapter/spotify';
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

    constructor(public adapter: SoptifyAdapter) {
        super();
    }

    async isLoggedIn() {
        try {
            const profile = await this.adapter.me();

            return SpotifyServiceResult.success(!!profile.email);
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
}

export { SpotifyService };
