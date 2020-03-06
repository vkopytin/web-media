import { ServiceResult } from '../base/serviceResult';
import { SpotifyService } from './spotify';
import { SettingsService } from './settings';
import { SpotifyPlayerService } from './spotifyPlayer';
import { asyncQueue } from '../utils';
import * as _ from 'underscore';
import { SpotifyPlayerServiceResult } from './results/spotifyPlayerServiceResult';
import { PlaylistsStore } from '../data/entities/playlistsStore';
import { DataStorage } from '../data/dataStorage';


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
        const playerResult = await this.service(SpotifyPlayerService);

        return playerResult;
    }

    async spotifyPlayerState() {
        const playerResult = await this.service(SpotifyPlayerService);

        if (playerResult.isError) {
            return playerResult;
        }

        return SpotifyPlayerServiceResult.success(await playerResult.val.getCurrentState());
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

    async listTopTracks() {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.listTopTracks();

        return result;
    }

    async addTrack(trackId: string) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.addTrack(trackId);

        return result;
    }

    async removeTracks(trackIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.removeTracks(trackIds);

        return result;
    }

    async hasTracks(trackIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.hasTracks(trackIds);

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

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.fetchRecommendations(
            market,
            seedArtists,
            seedTracks,
            minEnergy,
            minPopularity
        );

        return result;
    }

    async fetchMyPlaylists(offset = 0, limit = 20) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.fetchMyPlaylists(offset, limit);

        return result;
    }

    async fetchPlaylistTracks(playlistId, offset=0, limit=20) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.fetchPlaylistTracks(playlistId, offset, limit);

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

    async player(deviceId='', play=null) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.player(deviceId, play);

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

    async fetchTracks(offset = 0, limit = 20) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.fetchTracks(offset, limit);

        return result;
    }

    async albums(offset?, limit?) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.albums(offset, limit);

        return result;
    }


    async addAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.addAlbums(albumIds);

        return result;
    }

    async removeAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.removeAlbums(albumIds);

        return result;
    }

    async hasAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.hasAlbums(albumIds);

        return result;
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.createNewPlaylist(userId, name, description, isPublic);

        return result;
    }

    async addTrackToPlaylist(trackUris: string | string[], playlistId: string) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.addTrackToPlaylist(trackUris, playlistId);

        return result;
    }

    async removeTrackFromPlaylist(trackUris: string | string[], playlistId: string) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.removeTrackFromPlaylist(trackUris, playlistId);

        return result;
    }
}

export { Service, SpotifyService };
