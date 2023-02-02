import * as _ from 'underscore';
import { Result } from '../utils/result';
import { DataService } from './dataService';
import { LoginService } from './loginService';
import { SettingsService } from './settings';
import { MediaService } from './mediaService';
import { PlaybackService } from './playbackService';
import { ITrack, IUserPlaylist } from '../ports/iMediaProt';
import { RemotePlaybackService } from './remotePlaybackService';
import { LogService } from './logService';

export class AppService {
    constructor(
        private logService: LogService,
        private settingsService: SettingsService,
        private loginService: LoginService,
        private dataService: DataService,
        private mediaService: MediaService,
        private playbackService: PlaybackService,
        private remotePlaybackService: RemotePlaybackService,
    ) {

    }

    async isLoggedIn(): Promise<Result<Error, boolean>> {
        const isLoggedInResult = await this.loginService.isLoggedIn();
        return await isLoggedInResult.match(async isLoggedIn => {
            if (!isLoggedIn) {

                return isLoggedInResult;
            }

            return await this.mediaService.isLoggedIn();
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
        this.mediaService.refreshToken(newToken);
        this.remotePlaybackService.refreshToken(newToken);
        const mediaResult = newSettingsResult.map(() => this.mediaService);
        const refreshPlayerTokenResult = await mediaResult.cata(media => media.refreshToken(newToken));
        const playerResult = await refreshPlayerTokenResult.map(() => this.playbackService);

        return await playerResult.cata(async player => {
            await player.refreshToken();

            return Result.of(true);
        });
    }

    async addTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = ([] as ITrack[]).concat(tracks);
        const result = await this.mediaService.addTracks(_.map(arrTracks, t => t.id));

        return result;
    }

    async removeTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = ([] as ITrack[]).concat(tracks);
        const result = await this.mediaService.removeTracks(_.map(arrTracks, t => t.id));

        return result;
    }

    async addTrackToPlaylist(tracks: ITrack | ITrack[], playlist: IUserPlaylist) {
        tracks = ([] as ITrack[]).concat(tracks);
        const result = await this.mediaService.addTrackToPlaylist(_.map(([] as ITrack[]).concat(tracks), t => t.uri), playlist.id);

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
        const result = await this.mediaService.removeTrackFromPlaylist(_.map(arrTracks, t => t.uri), playlistId);

        for (const track of arrTracks) {
            await this.dataService.removeTrackFromPlaylist(playlistId, {
                added_at: new Date().toISOString(),
                track
            });
        }

        return result;
    }

}
