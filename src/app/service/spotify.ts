import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { ErrorWithStatus } from './adapter/errors/errorWithStatus';
import { TokenExpiredError } from './errors/tokenExpiredError';
import { SpotifyServiceError } from './errors/spotifyServiceError';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import * as $ from 'jquery';
import { SpotifyAdapter, IUserInfo, IDevice } from './adapter/spotify';
import { ISettings } from './settings';
import { withEvents } from 'databindjs';
import { DataStorage } from '../data/dataStorage';
import { asAsync, debounce } from '../utils';


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
            const adapter = new SpotifyAdapter(spotifySettgins.accessToken);

            return SpotifyServiceResult.success(new SpotifyService(adapter));

        } catch (ex) {

            return returnErrorResult('Unexpected error on requesting sptify service', ex);
        }
    }

    currentProfile: IUserInfo = null;
    onStateChanged = debounce(this.onStateChangedInternal, 500);

    constructor(public adapter: SpotifyAdapter) {
        super();
    }

    onStateChangedInternal(...args) {
        this.trigger('change:state', ...args);
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

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50, limit = 20) {
        try {
            const res = await this.adapter.recommendations(
                market,
                seedArtists,
                seedTracks,
                minEnergy,
                minPopularity,
                limit
            );

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

    async fetchMyPlaylists(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.myPlaylists(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async fetchPlaylistTracks(playlistId, offset=0, limit=20) {
        try {
            const res = await this.adapter.listPlaylistTracks(playlistId, offset, limit);

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

    async addTrack(trackIds: string | string[]) {
        try {
            const res = await this.adapter.addTracks(trackIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async removeTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.removeTracks(trackIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async hasTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.hasTracks(trackIds);

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

    async fetchTracks(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.tracks(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async albums(offset, limit) {
        try {
            const res = await this.adapter.albums(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async addAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.addAlbums(albumIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async removeAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.removeAlbums(albumIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async hasAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.hasAlbums(albumIds);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        try {
            const res = await this.adapter.createNewPlaylist(userId, name, description, isPublic);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }
}

export { SpotifyService };
