import * as _ from 'underscore';
import { ITrack, IUserPlaylist } from '../adapter/spotify';
import { Result } from '../utils/result';
import { DataService } from './dataService';
import { LoginService } from './loginService';
import { SettingsService } from './settings';
import { SpotifyService } from './spotify';
import { SpotifyPlayerService } from './spotifyPlayer';
import { SpotifySyncService } from './spotifySyncService';


class Service {
    constructor(
        private settingsService: SettingsService,
        private loginService: LoginService,
        private dataService: DataService,
        private spotifyService: SpotifyService,
        private spotifySyncService: SpotifySyncService,
        private spotifyPlayerService: SpotifyPlayerService,
    ) {

    }

    async isLoggedIn(): Promise<Result<Error, boolean>> {
        const isLoggedInResult = await this.loginService.isLoggedIn();
        return await isLoggedInResult.match(async isLoggedIn => {
            if (!isLoggedIn) {

                return isLoggedInResult;
            }

            return await this.spotifyService.isLoggedIn();
        }, e => Promise.resolve(Result.error(e)));
    }

    async settings<K extends keyof SettingsService['config']>(
        propName: K,
        val?: SettingsService['config'][K]
    ): Promise<Result<Error, SettingsService['config'][K]>>;
    async settings<K extends keyof SettingsService['config']>(...args: unknown[]) {
        const propName = args[0] as K;
        const val = args[1] as SettingsService['config'][K];
        if (args.length > 1) {
            this.settingsService.set(propName, val);
        }

        return this.settingsService.get(propName);
    }

    async refreshToken(newToken: string): Promise<Result<Error, boolean>> {
        const newSettingsResult = await this.settings('spotify', { accessToken: newToken });
        const spotifyResult = await newSettingsResult.map(() => this.spotifyService);
        const refreshPlayerTokenResult = await spotifyResult.cata(spotify => spotify.refreshToken(newToken));
        const playerResult = await refreshPlayerTokenResult.map(() => this.spotifyPlayerService);

        return await playerResult.cata(async player => {
            await player.refreshToken();

            return Result.of(true);
        });
    }

    async addTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = ([] as ITrack[]).concat(tracks);
        const result = await this.spotifyService.addTracks(_.map(arrTracks, t => t.id));

        return result;
    }

    async removeTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = ([] as ITrack[]).concat(tracks);
        const result = await this.spotifyService.removeTracks(_.map(arrTracks, t => t.id));

        return result;
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        await this.spotifyService.createNewPlaylist(userId, name, description, isPublic);

        const syncPlaylistsResult = await this.spotifySyncService.syncMyPlaylists();

        return syncPlaylistsResult;
    }

    async addTrackToPlaylist(tracks: ITrack | ITrack[], playlist: IUserPlaylist) {
        tracks = ([] as ITrack[]).concat(tracks);
        const result = await this.spotifyService.addTrackToPlaylist(_.map(([] as ITrack[]).concat(tracks), t => t.uri), playlist.id);

        for (const track of tracks) {
            await this.dataService.createTrack(track);
            await this.dataService.addTrackToPlaylist(playlist, {
                added_at: new Date().toISOString(),
                track
            });
        }

        return result;
    }

    async removeTrackFromPlaylist(tracks: ITrack | ITrack[], playlistId: string) {
        const arrTracks = ([] as ITrack[]).concat(tracks);
        const result = await this.spotifyService.removeTrackFromPlaylist(_.map(arrTracks, t => t.uri), playlistId);

        for (const track of arrTracks) {
            await this.dataService.removeTrackFromPlaylist(playlistId, {
                added_at: new Date().toISOString(),
                track
            });
        }

        return result;
    }

}

export { Service };
