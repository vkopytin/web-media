import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { Events } from '../events';
import { IMediaPort, IRecommendationsResult, IReorderTracksResult, IResponseResult, ISearchResult, ISearchType, ISpotifyAlbum, ISpotifySong, ITopTracksResult, ITrack, IUserInfo, IUserPlaylistsResult } from '../ports/iMediaProt';
import { asyncDebounce } from '../utils';
import { Result } from '../utils/result';
import { NoActiveDeviceError } from './errors/noActiveDeviceError';
import { MediaServiceError } from './errors/mediaServiceError';
import { MediaServiceUnexpectedError } from './errors/mediaServiceUnexpectedError';
import { TokenExpiredError } from './errors/tokenExpiredError';


function returnErrorResult<T>(message: string, err: Error): Result<Error, T> {
    if (err instanceof ErrorWithStatus) {
        if (err.status === 401 && /expired/i.test(err.message)) {
            return TokenExpiredError.of(err.message, err);
        } else if (err.status === 404 && /active device/i.test(err.message)) {
            return NoActiveDeviceError.of(err.message, err);
        }

        return MediaServiceError.of<T>(err.message, err);
    }

    return MediaServiceUnexpectedError.of<T>(message, err);
}

export class MediaService extends Events {
    currentProfile: IUserInfo | null = null;
    onStateChanged = asyncDebounce((...args: Array<unknown>) => this.onStateChangedInternal(...args), 500);

    constructor(public mediaPort: IMediaPort) {
        super();
    }

    refreshToken(newToken: string): Result<Error, boolean> {
        this.mediaPort.token = newToken;
        return Result.of(true);
    }

    onStateChangedInternal(...args: Array<unknown>): void {
        this.trigger('change:state', ...args);
    }

    async profile(): Promise<Result<Error, IUserInfo>> {
        try {
            const res = this.currentProfile = this.currentProfile || await this.mediaPort.me();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify profile', ex as Error);
        }
    }

    async isLoggedIn(): Promise<Result<Error, boolean>> {
        try {
            const profile = this.currentProfile = this.currentProfile || await this.mediaPort.me();

            return Result.of(!!profile);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify service', ex as Error);
        }
    }

    async logout(): Promise<Result<Error, boolean>> {
        this.currentProfile = null;

        return Result.of(true);
    }

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50, limit = 20): Promise<Result<Error, IRecommendationsResult>> {
        try {
            const res = await this.mediaPort.recommendations(
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
            return Result.error(new Error('Can\'t fetch playlist. Empty id'));
        }
        try {
            const res = await this.mediaPort.userPlaylists(user.id);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify user playlists', ex as Error);
        }
    }

    async fetchMyPlaylists(offset = 0, limit = 20): Promise<Result<Error, IUserPlaylistsResult>> {
        try {
            const res = await this.mediaPort.myPlaylists(offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch my playlists', ex as Error);
        }
    }

    async fetchPlaylistTracks(playlistId: string, offset = 0, limit = 20): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.listPlaylistTracks(playlistId, offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch playlist tracks', ex as Error);
        }
    }

    async listTopTracks(): Promise<Result<Error, IResponseResult<ITrack>>> {
        try {
            const res = await this.mediaPort.myTopTracks();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify list top tracks', ex as Error);
        }
    }

    async fetchArtistTopTracks(artistId: string, country = 'US'): Promise<Result<Error, ITopTracksResult>> {
        try {
            const res = await this.mediaPort.artistTopTracks(artistId, country);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch artists top tracks', ex as Error);
        }
    }

    async addTracks(trackIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.addTracks(trackIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add tracks', ex as Error);
        }
    }

    async removeTracks(trackIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.removeTracks(trackIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove tracks', ex as Error);
        }
    }

    async hasTracks(trackIds: string | string[]): Promise<Result<Error, boolean[]>> {
        try {
            const res = await this.mediaPort.hasTracks(trackIds);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify has tracks', ex as Error);
        }
    }

    async listAlbumTracks(albumId: string): Promise<Result<Error, IResponseResult<ITrack>>> {
        try {
            const res = await this.mediaPort.listAlbumTracks(albumId);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify list album tracks', ex as Error);
        }
    }

    async newReleases(): Promise<Result<Error, ISearchResult>> {
        try {
            const res = await this.mediaPort.newReleases();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch new releases', ex as Error);
        }
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string): Promise<Result<Error, ISearchResult>> {
        try {
            const res = await this.mediaPort.featuredPlaylists(offset, limit, country, locale, timestamp);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify featured playlists', ex as Error);
        }
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20): Promise<Result<Error, ISearchResult>> {
        try {
            const res = await this.mediaPort.search(type, term, offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify search', ex as Error);
        }
    }

    async fetchTracks(offset = 0, limit = 20): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.tracks(offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch tracks', ex as Error);
        }
    }

    async albums(offset = 0, limit = 20): Promise<Result<Error, IResponseResult<ISpotifyAlbum>>> {
        try {
            const res = await this.mediaPort.albums(offset, limit);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify fetch albums', ex as Error);
        }
    }

    async addAlbums(albumIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.addAlbums(albumIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add albums', ex as Error);
        }
    }

    async removeAlbums(albumIds: string | string[]): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.removeAlbums(albumIds);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove albums', ex as Error);
        }
    }

    async hasAlbums(albumIds: string | string[]): Promise<Result<Error, boolean[]>> {
        try {
            const res = await this.mediaPort.hasAlbums(albumIds);

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify has albums', ex as Error);
        }
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false): Promise<Result<Error, unknown>> {
        try {
            const res = await this.mediaPort.createNewPlaylist(userId, name, description, isPublic);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify crate new playlist', ex as Error);
        }
    }

    async addTrackToPlaylist(trackUris: string | string[], playlistId: string): Promise<Result<Error, ISpotifySong>> {
        try {
            const res = await this.mediaPort.addTrackToPlaylist(trackUris, playlistId);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify add tracks to playlist', ex as Error);
        }
    }

    async removeTrackFromPlaylist(trackUris: string | string[], playlistId: string): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        try {
            const res = await this.mediaPort.removeTrackFromPlaylist(trackUris, playlistId);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify remove tracks from playlist', ex as Error);
        }
    }

    async reorderTracks(playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1): Promise<Result<Error, IReorderTracksResult>> {
        try {
            const res = await this.mediaPort.reorderTracks(playlistId, rangeStart, insertBefore, rangeLength);

            this.onStateChanged();

            return Result.of(res);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting spotify reorder tracks', ex as Error);
        }
    }
}
