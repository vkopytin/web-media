import { ServiceResult } from '../base/serviceResult';
import { SpotifyService } from './spotify';
import { SettingsService } from './settings';
import { SpotifyPlayerService } from './spotifyPlayer';
import { asyncQueue } from '../utils';
import * as _ from 'underscore';


const lockSpotifyService = asyncQueue();
const lockSettingsService = asyncQueue();
const lockSpotifyPlayerService = asyncQueue();

class Service {
    settingsService: ServiceResult<SettingsService, Error> = null;
    spotifyService: ServiceResult<SpotifyService, Error> = null;
    spotifyPlayerService: ServiceResult<SpotifyPlayerService, Error> = null;

    async service<T extends {}, O extends {}>(
        ctor: { prototype: T },
        options = {} as O
    ): Promise<ServiceResult<T, Error>> {
        switch (ctor) {
            case SpotifyService as any:
                return new Promise((resolve, reject) => {
                    lockSpotifyService.push(_.bind(async function (this: Service, next) {
                        if (this.spotifyService) {
                            resolve(this.spotifyService as any);
                            next();
                            return;
                        }

                        resolve(this.spotifyService = await SpotifyService.create(this) as any)
                        next();
                    }, this));
                });
            case SettingsService as any:
                return new Promise((resolve, reject) => {
                    lockSettingsService.push(_.bind(async function (this: Service, next) {
                        if (this.settingsService) {
                            resolve(this.settingsService as any);
                            next();
                            return;
                        }

                        resolve(this.settingsService = await SettingsService.create(this) as any);
                        next();
                    }, this));
                });
            case SpotifyPlayerService as any:
                return new Promise((resolve, reject) => {
                    lockSpotifyPlayerService.push(_.bind(async function (this: Service, next) {
                        if (this.spotifyPlayerService) {
                            resolve(this.spotifyPlayerService as any);
                            next();
                            return;
                        }

                        resolve(this.spotifyPlayerService = await SpotifyPlayerService.create(this) as any);
                        next();
                    }, this));
                });
            default:
                throw new Error('Unexpected service request');
        }
    }

    async isLoggedIn() {
        const spotifyResult = await this.service(SpotifyService);
        if (spotifyResult.isError) {
            return spotifyResult;
        }

        return spotifyResult.val.isLoggedIn();
    }

    async settings<K extends keyof SettingsService['config']>(
        propName: K, val?: SettingsService['config'][K]
    ) {
        const settingsResult = await this.service(SettingsService);
        if (settingsResult.isError) {

            return settingsResult;
        }

        return settingsResult.val.get(propName);
    }

    async spotifyPlayer() {
        const player = await this.service(SpotifyPlayerService);

        return player;
    }

    async playerResume() {
        const player = await this.spotifyPlayer();
        player.val.resume();
    }

    async playerPause() {
        const player = await this.spotifyPlayer();
        player.val.pause();
    }
    async playerNextTrack() {
        const player = await this.spotifyPlayer();
        player.val.nextTrack();
    }
    async playerPreviouseTrack() {
        const player = await this.spotifyPlayer();
        player.val.previouseTrack();
    }
    async playerVolumeUp() {
        const player = await this.spotifyPlayer();
        player.val.volumeUp();
    }
    async playerVolumeDown() {
        const player = await this.spotifyPlayer();
        player.val.volumeDown();
    }

    async recentlyPlayed() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.recentlyPlayed();

        return result;
    }

    async listDevices() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.listDevices();

        return result;
    }

    async volume(percent) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.volume(percent);

        return result;
    }

    async profile() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.profile();

        return result;
    }

    async recommendations() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.listRecommendations();

        return result;
    }

    async myPlaylists() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.myPlaylists();

        return result;
    }

    async listPlaylistTracks(playlistId) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.listPlaylistTracks(playlistId);

        return result;
    }

    async listAlbumTracks(albumId) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.listAlbumTracks(albumId);

        return result;
    }

    async seek(positionMs: number, deviceId = '') {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.seek(positionMs, deviceId);

        return result;
    }

    async play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.play(deviceId, tracksUriList, indexOrUri);

        return result;
    }

    async pause(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.pause(deviceId);

        return result;
    }

    async next(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.next(deviceId);

        return result;
    }

    async previous(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.previous(deviceId);

        return result;
    }

    async newReleases() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.newReleases();

        return result;
    }

    async search(term, offset, limit) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.search(term, offset, limit);

        return result;
    }

    async player() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.player();

        return result;
    }

    async currentlyPlaying() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.currentlyPlaying();

        return result;
    }

    async tracks(offset?, limit?) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.tracks(offset, limit);

        return result;
    }
}

export { Service, SpotifyService };
