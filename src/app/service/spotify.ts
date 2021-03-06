import { BaseService } from '../base/baseService';
import { Service } from './index';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { TokenExpiredError } from './errors/tokenExpiredError';
import { SpotifyServiceError } from './errors/spotifyServiceError';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import { SpotifyAdapter, IUserInfo, ISearchType, IResponseResult, ISpotifySong, IUserPlaylistsResult, ITrack, ITopTracksResult, ISearchResult, IAlbum, IDevice, IPlayerResult, ICurrentlyPlayingResult, IRecommendationsResult } from '../adapter/spotify';
import { ISettings } from './settings';
import { withEvents } from 'databindjs';
import { debounce } from '../utils';
import { NoActiveDeviceError } from './errors/noActiveDeviceError';
import { ServiceResult } from '../base/serviceResult';


function returnErrorResult<T>(message: string, ex: Error): ServiceResult<T, Error> {
    switch (true) {
        case ex instanceof ErrorWithStatus:
            const err = ex as ErrorWithStatus;
            switch (err.status) {
                case 401:
                    if (/expired/i.test(err.message)) {
                        return TokenExpiredError.create<T>(err.message, err);
                    }
                case 404:
                    if (/active device/i.test(err.message)) {
                        return NoActiveDeviceError.create<T>(err.message, err);
                    }
            }
            return SpotifyServiceError.create<T>(err.message, err);
        default:
            return SpotifyServiceUnexpectedError.create<T>(message, ex);
    }
}

class SpotifyService extends withEvents(BaseService) {
    static async create(connection: Service) {
        try {
            const settingsResult = await connection.settings('spotify');

            return settingsResult
                .cata(s => SpotifyServiceResult.success(new SpotifyService(
                    new SpotifyAdapter(s.accessToken)
                )));
        } catch (ex) {
            return returnErrorResult<SpotifyService>('Unexpected error on requesting spotify service', ex);
        }
    }

    currentProfile: IUserInfo = null;
    onStateChanged = debounce(this.onStateChangedInternal, 500);

    constructor(public adapter: SpotifyAdapter) {
        super();
    }

    refreshToken(newToken: string) {
        this.adapter.token = newToken;
        return SpotifyServiceResult.success(true);
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
            return returnErrorResult<IPlayerResult>('Unexpected error on requesting spotify seek', ex);
        }
    }

    async play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        try {
            const res = await this.adapter.play(deviceId, tracksUriList, indexOrUri);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify play', ex);
        }
    }

    async pause(deviceId: string = null) {
        try {
            const res = await this.adapter.pause(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify pause', ex);
        }
    }

    async next(deviceId: string = null) {
        try {
            const res = await this.adapter.next(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify next', ex);
        }
    }

    async previous(deviceId: string = null) {
        try {
            const res = await this.adapter.previous(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify previous', ex);
        }
    }

    async volume(percent: number) {
        try {
            const res = await this.adapter.volume(Math.round(percent));

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify volume', ex);
        }
    }

    async profile() {
        try {
            const res = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IUserInfo>('Unexpected error on requesting spotify profile', ex);
        }
    }

    async isLoggedIn() {
        try {
            const profile = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(!!profile);
        } catch (ex) {
            return returnErrorResult<boolean>('Unexpected error on requesting spotify service', ex);
        }
    }

    async logout() {
        this.currentProfile = null;

        return SpotifyServiceResult.success(true);
    }

    async recentlyPlayed() {
        try {
            const res = await this.adapter.recentlyPlayed();

            return SpotifyServiceResult.success(res.items);
        } catch (ex) {
            return returnErrorResult<ISpotifySong[]>('Unexpected error on requesting spotify recently played', ex);
        }
    }

    async listDevices() {
        try {
            const res = await this.adapter.devices();

            return SpotifyServiceResult.success(res.devices);
        } catch (ex) {
            return returnErrorResult<IDevice[]>('Unexpected error on requesting spotify list devices', ex);
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
            return returnErrorResult<IRecommendationsResult>('Unexpected error on requesting spotify fetch recommendations', ex);
        }
    }

    async userPlaylists(user: IUserInfo) {
        try {
            const res = await this.adapter.userPlaylists(user.id);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IUserPlaylistsResult>('Unexpected error on requesting spotify user playlists', ex);
        }
    }

    async fetchMyPlaylists(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.myPlaylists(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IUserPlaylistsResult>('Unexpected error on requesting spotify fetch my playlists', ex);
        }
    }

    async fetchPlaylistTracks(playlistId, offset=0, limit=20) {
        try {
            const res = await this.adapter.listPlaylistTracks(playlistId, offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify fetch playlist tracks', ex);
        }
    }

    async listTopTracks() {
        try {
            const res = await this.adapter.myTopTracks();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ITrack>>('Unexpected error on requesting spotify list top tracks', ex);
        }
    }

    async fetchArtistTopTracks(artistId: string, country = 'US') {
        try {
            const res = await this.adapter.artistTopTracks(artistId, country);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ITopTracksResult>('Unexpected error on requesting spotify fetch artists top tracks', ex);
        }
    }

    async addTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.addTracks(trackIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify add tracks', ex);
        }
    }

    async removeTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.removeTracks(trackIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify remove tracks', ex);
        }
    }

    async hasTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.hasTracks(trackIds);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<boolean[]>('Unexpected error on requesting spotify has tracks', ex);
        }
    }

    async listAlbumTracks(albumId) {
        try {
            const res = await this.adapter.listAlbumTracks(albumId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ITrack>>('Unexpected error on requesting spotify list album tracks', ex);
        }
    }

    async newReleases() {
        try {
            const res = await this.adapter.newReleases();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<IAlbum>>('Unexpected error on requesting spotify fetch new releases', ex);
        }
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string) {
        try {
            const res = await this.adapter.featuredPlaylists(offset, limit, country, locale, timestamp);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ISearchResult>('Unexpected error on requesting spotify featured playlists', ex);
        }
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20) {
        try {
            const res = await this.adapter.search(type, term, offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ISearchResult>('Unexpected error on requesting spotify search', ex);
        }
    }

    async player(deviceId='', play=null) {
        try {
            const res = await this.adapter.player(deviceId, play);

            play !== null && this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IPlayerResult>('Unexpected error on requesting spotify player', ex);
        }
    }

    async currentlyPlaying() {
        try {
            const res = await this.adapter.currentlyPlaying();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ICurrentlyPlayingResult>('Unexpected error on requesting spotify currently playing', ex);
        }
    }

    async fetchTracks(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.tracks(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify fetch tracks', ex);
        }
    }

    async albums(offset, limit) {
        try {
            const res = await this.adapter.albums(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch albums', ex);
        }
    }

    async addAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.addAlbums(albumIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add albums', ex);
        }
    }

    async removeAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.removeAlbums(albumIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove albums', ex);
        }
    }

    async hasAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.hasAlbums(albumIds);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify has albums', ex);
        }
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        try {
            const res = await this.adapter.createNewPlaylist(userId, name, description, isPublic);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify crate new playlist', ex);
        }
    }

    async addTrackToPlaylist(trackUris: string | string[], playlistId: string) {
        try {
            const res = await this.adapter.addTrackToPlaylist(trackUris, playlistId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify add tracks to playlist', ex);
        }
    }

    async removeTrackFromPlaylist(trackUris: string | string[], playlistId: string) {
        try {
            const res = await this.adapter.removeTrackFromPlaylist(trackUris, playlistId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify remove tracks from playlist', ex);
        }
    }

    async reorderTracks(playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1) {
        try {
            const res = await this.adapter.reorderTracks(playlistId, rangeStart, insertBefore, rangeLength);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify reorder tracks', ex);
        }
    }
}

export { SpotifyService };
