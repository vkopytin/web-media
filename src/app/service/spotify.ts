import { BaseService } from '../base/baseService';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { TokenExpiredError } from './errors/tokenExpiredError';
import { SpotifyServiceError } from './errors/spotifyServiceError';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import * as _ from 'underscore';
import { SpotifyAdapter, IUserInfo, ISearchType, IResponseResult, ISpotifySong, IUserPlaylistsResult, ITrack, ITopTracksResult, ISearchResult, IAlbum, IDevice, IPlayerResult, ICurrentlyPlayingResult, IRecommendationsResult } from '../adapter/spotify';
import { withEvents } from 'databindjs';
import { asyncDebounce } from '../utils';
import { NoActiveDeviceError } from './errors/noActiveDeviceError';
import { ServiceResult } from '../base/serviceResult';


function returnErrorResult<T>(message: string, err: Error): ServiceResult<T, Error> {
    if (err instanceof ErrorWithStatus) {
        if (err.status === 401 && /expired/i.test(err.message)) {
            return TokenExpiredError.create<T>(err.message, err);
        } else if (err.status === 404 && /active device/i.test(err.message)) {
            return NoActiveDeviceError.create<T>(err.message, err);
        }

        return SpotifyServiceError.create<T>(err.message, err);
    }

    return SpotifyServiceUnexpectedError.create<T>(message, err);
}

class SpotifyService extends withEvents(BaseService) {
    currentProfile: IUserInfo | null = null;
    onStateChanged = asyncDebounce(this.onStateChangedInternal, 500);

    constructor(public adapter: SpotifyAdapter) {
        super();
    }

    refreshToken(newToken: string) {
        this.adapter.token = newToken;
        return SpotifyServiceResult.success(true);
    }

    onStateChangedInternal(...args: unknown[]) {
        this.trigger('change:state', ...args);
    }

    async seek(positionMs: number, deviceId: string) {
        try {
            const res = await this.adapter.seek(Math.round(positionMs), deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IPlayerResult>('Unexpected error on requesting spotify seek', ex as Error);
        }
    }

    async play(deviceId?: string, tracksUriList?: string | string[], indexOrUri: number | string = '') {
        try {
            const res = await this.adapter.play(tracksUriList, indexOrUri, deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify play', ex as Error);
        }
    }

    async pause(deviceId = '') {
        try {
            const res = await this.adapter.pause(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify pause', ex as Error);
        }
    }

    async next(deviceId = '') {
        try {
            const res = await this.adapter.next(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify next', ex as Error);
        }
    }

    async previous(deviceId: string = '') {
        try {
            const res = await this.adapter.previous(deviceId);

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify previous', ex as Error);
        }
    }

    async volume(percent: number) {
        try {
            const res = await this.adapter.volume(Math.round(percent));

            this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify volume', ex as Error);
        }
    }

    async profile() {
        try {
            const res = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IUserInfo>('Unexpected error on requesting spotify profile', ex as Error);
        }
    }

    async isLoggedIn() {
        try {
            const profile = this.currentProfile = this.currentProfile || await this.adapter.me();

            return SpotifyServiceResult.success(!!profile);
        } catch (ex) {
            return returnErrorResult<boolean>('Unexpected error on requesting spotify service', ex as Error);
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
            return returnErrorResult<ISpotifySong[]>('Unexpected error on requesting spotify recently played', ex as Error);
        }
    }

    async listDevices() {
        try {
            const res = await this.adapter.devices();

            return SpotifyServiceResult.success(res.devices);
        } catch (ex) {
            return returnErrorResult<IDevice[]>('Unexpected error on requesting spotify list devices', ex as Error);
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
            return returnErrorResult<IRecommendationsResult>('Unexpected error on requesting spotify fetch recommendations', ex as Error);
        }
    }

    async userPlaylists(user: IUserInfo) {
        if (!user.id) {
            throw new Error('Can\'t fetch playlist. Empty id');
        }
        try {
            const res = await this.adapter.userPlaylists(user.id);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IUserPlaylistsResult>('Unexpected error on requesting spotify user playlists', ex as Error);
        }
    }

    async fetchMyPlaylists(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.myPlaylists(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IUserPlaylistsResult>('Unexpected error on requesting spotify fetch my playlists', ex as Error);
        }
    }

    async fetchPlaylistTracks(playlistId: string, offset = 0, limit = 20) {
        try {
            const res = await this.adapter.listPlaylistTracks(playlistId, offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify fetch playlist tracks', ex as Error);
        }
    }

    async listTopTracks() {
        try {
            const res = await this.adapter.myTopTracks();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ITrack>>('Unexpected error on requesting spotify list top tracks', ex as Error);
        }
    }

    async fetchArtistTopTracks(artistId: string, country = 'US') {
        try {
            const res = await this.adapter.artistTopTracks(artistId, country);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ITopTracksResult>('Unexpected error on requesting spotify fetch artists top tracks', ex as Error);
        }
    }

    async addTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.addTracks(trackIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify add tracks', ex as Error);
        }
    }

    async removeTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.removeTracks(trackIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify remove tracks', ex as Error);
        }
    }

    async hasTracks(trackIds: string | string[]) {
        try {
            const res = await this.adapter.hasTracks(trackIds);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<boolean[]>('Unexpected error on requesting spotify has tracks', ex as Error);
        }
    }

    async listAlbumTracks(albumId: string) {
        try {
            const res = await this.adapter.listAlbumTracks(albumId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ITrack>>('Unexpected error on requesting spotify list album tracks', ex as Error);
        }
    }

    async newReleases() {
        try {
            const res = await this.adapter.newReleases();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ISearchResult>('Unexpected error on requesting spotify fetch new releases', ex as Error);
        }
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string) {
        try {
            const res = await this.adapter.featuredPlaylists(offset, limit, country, locale, timestamp);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ISearchResult>('Unexpected error on requesting spotify featured playlists', ex as Error);
        }
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20) {
        try {
            const res = await this.adapter.search(type, term, offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ISearchResult>('Unexpected error on requesting spotify search', ex as Error);
        }
    }

    async player(deviceId = '', play: boolean | null = null) {
        try {
            const res = await this.adapter.player(deviceId, play);

            play !== null && this.onStateChanged(res);
            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IPlayerResult>('Unexpected error on requesting spotify player', ex as Error);
        }
    }

    async currentlyPlaying() {
        try {
            const res = await this.adapter.currentlyPlaying();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<ICurrentlyPlayingResult>('Unexpected error on requesting spotify currently playing', ex as Error);
        }
    }

    async fetchTracks(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.tracks(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify fetch tracks', ex as Error);
        }
    }

    async albums(offset = 0, limit = 20) {
        try {
            const res = await this.adapter.albums(offset, limit);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch albums', ex as Error);
        }
    }

    async addAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.addAlbums(albumIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add albums', ex as Error);
        }
    }

    async removeAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.removeAlbums(albumIds);

            this.onStateChanged();

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove albums', ex as Error);
        }
    }

    async hasAlbums(albumIds: string | string[]) {
        try {
            const res = await this.adapter.hasAlbums(albumIds);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify has albums', ex as Error);
        }
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        try {
            const res = await this.adapter.createNewPlaylist(userId, name, description, isPublic);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify crate new playlist', ex as Error);
        }
    }

    async addTrackToPlaylist(trackUris: string | string[], playlistId: string) {
        try {
            const res = await this.adapter.addTrackToPlaylist(trackUris, playlistId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify add tracks to playlist', ex as Error);
        }
    }

    async removeTrackFromPlaylist(trackUris: string | string[], playlistId: string) {
        try {
            const res = await this.adapter.removeTrackFromPlaylist(trackUris, playlistId);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult<IResponseResult<ISpotifySong>>('Unexpected error on requesting spotify remove tracks from playlist', ex as Error);
        }
    }

    async reorderTracks(playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1) {
        try {
            const res = await this.adapter.reorderTracks(playlistId, rangeStart, insertBefore, rangeLength);

            return SpotifyServiceResult.success(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify reorder tracks', ex as Error);
        }
    }
}

export { SpotifyService };
