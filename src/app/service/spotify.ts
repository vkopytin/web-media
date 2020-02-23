import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { ErrorWithStatus } from './adapter/errors/errorWithStatus';
import { TokenExpiredError } from './errors/tokenExpiredError';
import { SpotifyServiceError } from './errors/spotifyServiceError';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import * as $ from 'jquery';
import { SoptifyAdapter, IUserInfo, IDevice } from './adapter/spotify';
import { ISettings } from './settings';
import { withEvents } from 'databindjs';


function returnErrorResult<T>(message: string, ex: Error) {
    switch (true) {
        case ex instanceof ErrorWithStatus:
            const err = ex as ErrorWithStatus;
            if (err.status === 401) {
                return TokenExpiredError.create(err.message, err);
            }
            return SpotifyServiceError.create(err.message, err);
        default:
            return SpotifyServiceUnexpectedError.create<T>(message, ex);
    }
}

class SpotifyService extends withEvents(BaseService) {
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

            return returnErrorResult('Unexpected error on requesting sptify service', ex);
        }
    }

    currentProfile: IUserInfo = null;

    constructor(public adapter: SoptifyAdapter) {
        super();
    }

    onStateChanged(...args) {
        _.delay(() => {
            this.trigger('change:state', ...args);
        });
    }


    async seek(positionMs, deviceId) {
        try {
            const res = await this.adapter.seek(Math.round(positionMs), deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        try {
            const res = await this.adapter.play(deviceId, tracksUriList, indexOrUri);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async pause(deviceId: string = null) {
        try {
            const res = await this.adapter.pause(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async next(deviceId: string = null) {
        try {
            const res = await this.adapter.next(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async previous(deviceId: string = null) {
        try {
            const res = await this.adapter.previous(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async volume(percent: number) {
        try {
            const res = await this.adapter.volume(Math.round(percent));

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async profile() {
        try {
            const res = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async isLoggedIn() {
        try {
            const profile = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(!!profile);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify service', ex);
        }
    }

    async recentlyPlayed() {
        try {
            const res = await this.adapter.recentlyPlayed();

            return SpotifyServiceResult.success(res.items);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listDevices() {
        try {
            const res = await this.adapter.devices();

            return SpotifyServiceResult.success(res.devices);
        } catch (ex) {
            return returnErrorResult<any>('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listRecommendations() {
        try {
            const res = await this.adapter.recommendations('US',
                '07vycW8ICLf5hKb22PFWXw,4w90cLrCPXk5Z5x7d8tetY',
                '4SFcuHDFVPjBFSJwi2YcIr,2TIjrhkXVtl9m0v5BRLy2M',
                0.4, 50);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async userPlaylists(user: IUserInfo) {
        try {
            const res = await this.adapter.userPlaylists(user.id);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async myPlaylists() {
        try {
            const res = await this.adapter.myPlaylists();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listPlaylistTracks(playlistId) {
        try {
            const res = await this.adapter.listPlaylistTracks(playlistId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listTopTracks() {
        try {
            const res = await this.adapter.myTopTracks();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async listAlbumTracks(albumId) {
        try {
            const res = await this.adapter.listAlbumTracks(albumId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async newReleases() {
        try {
            const res = await this.adapter.newReleases();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async search(term, offset, limit) {
        try {
            const res = await this.adapter.search(term, offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async player(deviceId='', play=null) {
        try {
            const res = await this.adapter.player(deviceId, play);

            play !== null && this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async currentlyPlaying() {
        try {
            const res = await this.adapter.currentlyPlaying();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async tracks(offset, limit) {
        try {
            const res = await this.adapter.tracks(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }
}

export { SpotifyService };
