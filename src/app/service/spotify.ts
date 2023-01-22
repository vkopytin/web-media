import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { ICurrentlyPlayingResult, IDevice, IPlayerResult, IRecommendationsResult, IReorderTracksResult, IResponseResult, ISearchResult, ISearchType, ISpotifyAlbum, ISpotifySong, ITopTracksResult, ITrack, IUserInfo, IUserPlaylistsResult, SpotifyAdapter } from '../adapter/spotify';
import { Events } from '../events';
import { asyncDebounce } from '../utils';
import { Result } from '../utils/result';
import { NoActiveDeviceError } from './errors/noActiveDeviceError';
import { SpotifyServiceError } from './errors/spotifyServiceError';
import { SpotifyServiceUnexpectedError } from './errors/spotifyServiceUnexpectedError';
import { TokenExpiredError } from './errors/tokenExpiredError';


function returnErrorResult<T>(message: string, err: Error): Result<Error, T> {
    if (err instanceof ErrorWithStatus) {
        if (err.status === 401 && /expired/i.test(err.message)) {
            return TokenExpiredError.of(err.message, err);
        } else if (err.status === 404 && /active device/i.test(err.message)) {
            return NoActiveDeviceError.of(err.message, err);
        }

        return SpotifyServiceError.of<T>(err.message, err);
    }

    return SpotifyServiceUnexpectedError.of<T>(message, err);
}

class SpotifyService extends Events {
    currentProfile: IUserInfo | null = null;
    onStateChanged = asyncDebounce((...args: Array<unknown>) => this.onStateChangedInternal(...args), 500);

    constructor(public adapter: SpotifyAdapter) {
        super();
    }

    refreshToken(newToken: string): Result<Error, boolean> {
        this.adapter.token = newToken;
        return Result.of(true);
    }

    onStateChangedInternal(...args: Array<unknown>): void {
        this.trigger('change:state', ...args);
    }

    async seek(positionMs: number, deviceId = ''): Promise<Result<Error, void>> {
        try {
            const res = await this.adapter.seek(Math.round(positionMs), deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult<void>('Unexpected error on requesting spotify seek', ex as Error);
        }
    }

    async play(deviceId?: string, tracksUriList?: string | string[], indexOrUri: number | string = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.adapter.play(tracksUriList, indexOrUri, deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify play', ex as Error);
        }
    }

    async pause(deviceId = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.adapter.pause(deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify pause', ex as Error);
        }
    }

    async next(deviceId = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.adapter.next(deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify next', ex as Error);
        }
    }

    async previous(deviceId = ''): Promise<Result<Error, unknown>> {
        try {
            const res = await this.adapter.previous(deviceId);

            this.onStateChanged({});
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify previous', ex as Error);
        }
    }

    async volume(percent: number): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.volume(Math.round(percent));

            this.onStateChanged(res);
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify volume', ex as Error);
        }
    }

    async profile(): Promise<Result<Error, IUserInfo>> {
        try {
            const res = this.currentProfile = this.currentProfile || await this.adapter.me();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify profile', ex as Error);
        }
    }

    async isLoggedIn(): Promise<Result<Error, boolean>> {
        try {
            const profile = this.currentProfile = this.currentProfile || await this.adapter.me();

            return Result.of(!!profile);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify service', ex as Error);
        }
    }

    async logout(): Promise<Result<Error, boolean>> {
        this.currentProfile = null;

        return Result.of(true);
    }

    async recentlyPlayed(): Promise<Result<Error, ISpotifySong[]>> {
        try {
            const res = await this.adapter.recentlyPlayed();

            return Result.of(res.items);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify recently played', ex as Error);
        }
    }

    async listDevices(): Promise<Result<Error, IDevice[]>> {
        try {
            const res = await this.adapter.devices();

            return Result.of(res.devices);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify list devices', ex as Error);
        }
    }

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50, limit = 20): Promise<Result<Error, IRecommendationsResult>> {
        try {
            const res = await this.adapter.recommendations(
                market,
                seedArtists,
                seedTracks,
                minEnergy,
                minPopularity,
                limit
            );

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch recommendations', ex as Error);
        }
    }

    async userPlaylists(user: IUserInfo): Promise<Result<Error, IUserPlaylistsResult>> {
        if (!user.id) {
            throw new Error('Can\'t fetch playlist. Empty id');
        }
        try {
            const res = await this.adapter.userPlaylists(user.id);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify user playlists', ex as Error);
        }
    }

    async fetchMyPlaylists(offset = 0, limit = 20): Promise<Result<Error, IUserPlaylistsResult>> {
        try {
            const res = await this.adapter.myPlaylists(offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch my playlists', ex as Error);
        }
    }

    async fetchPlaylistTracks(playlistId: string, offset = 0, limit = 20): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.listPlaylistTracks(playlistId, offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch playlist tracks', ex as Error);
        }
    }

    async listTopTracks(): Promise<Result<Error, IResponseResult<ITrack>>> {
        try {
            const res = await this.adapter.myTopTracks();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify list top tracks', ex as Error);
        }
    }

    async fetchArtistTopTracks(artistId: string, country = 'US'): Promise<Result<Error, ITopTracksResult>> {
        try {
            const res = await this.adapter.artistTopTracks(artistId, country);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch artists top tracks', ex as Error);
        }
    }

    async addTracks(trackIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.addTracks(trackIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add tracks', ex as Error);
        }
    }

    async removeTracks(trackIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.removeTracks(trackIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove tracks', ex as Error);
        }
    }

    async hasTracks(trackIds: string | string[]): Promise<Result<Error, boolean[]>> {
        try {
            const res = await this.adapter.hasTracks(trackIds);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify has tracks', ex as Error);
        }
    }

    async listAlbumTracks(albumId: string): Promise<Result<Error, IResponseResult<ITrack>>> {
        try {
            const res = await this.adapter.listAlbumTracks(albumId);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify list album tracks', ex as Error);
        }
    }

    async newReleases(): Promise<Result<Error, ISearchResult>> {
        try {
            const res = await this.adapter.newReleases();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch new releases', ex as Error);
        }
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string): Promise<Result<Error, ISearchResult>> {
        try {
            const res = await this.adapter.featuredPlaylists(offset, limit, country, locale, timestamp);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify featured playlists', ex as Error);
        }
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20): Promise<Result<Error, ISearchResult>> {
        try {
            const res = await this.adapter.search(type, term, offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify search', ex as Error);
        }
    }

    async player(deviceId = '', play: boolean | null = null): Promise<Result<Error, IPlayerResult>> {
        try {
            const res = await this.adapter.player(deviceId, play);

            play !== null && this.onStateChanged(res);
            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify player', ex as Error);
        }
    }

    async currentlyPlaying(): Promise<Result<Error, ICurrentlyPlayingResult>> {
        try {
            const res = await this.adapter.currentlyPlaying();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify currently playing', ex as Error);
        }
    }

    async fetchTracks(offset = 0, limit = 20): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.tracks(offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch tracks', ex as Error);
        }
    }

    async albums(offset = 0, limit = 20): Promise<Result<Error, IResponseResult<ISpotifyAlbum>>> {
        try {
            const res = await this.adapter.albums(offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch albums', ex as Error);
        }
    }

    async addAlbums(albumIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.addAlbums(albumIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add albums', ex as Error);
        }
    }

    async removeAlbums(albumIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.removeAlbums(albumIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove albums', ex as Error);
        }
    }

    async hasAlbums(albumIds: string | string[]): Promise<Result<Error, boolean[]>> {
        try {
            const res = await this.adapter.hasAlbums(albumIds);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify has albums', ex as Error);
        }
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false): Promise<Result<Error, unknown>> {
        try {
            const res = await this.adapter.createNewPlaylist(userId, name, description, isPublic);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify crate new playlist', ex as Error);
        }
    }

    async addTrackToPlaylist(trackUris: string | string[], playlistId: string): Promise<Result<Error, ISpotifySong>> {
        try {
            const res = await this.adapter.addTrackToPlaylist(trackUris, playlistId);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add tracks to playlist', ex as Error);
        }
    }

    async removeTrackFromPlaylist(trackUris: string | string[], playlistId: string): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.adapter.removeTrackFromPlaylist(trackUris, playlistId);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove tracks from playlist', ex as Error);
        }
    }

    async reorderTracks(playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1): Promise<Result<Error, IReorderTracksResult>> {
        try {
            const res = await this.adapter.reorderTracks(playlistId, rangeStart, insertBefore, rangeLength);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify reorder tracks', ex as Error);
        }
    }
}

export { SpotifyService };
