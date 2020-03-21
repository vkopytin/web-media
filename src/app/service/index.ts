import { ServiceResult } from '../base/serviceResult';
import { SpotifyService } from './spotify';
import { SettingsService } from './settings';
import { SpotifyPlayerService } from './spotifyPlayer';
import { asyncQueue } from '../utils';
import * as _ from 'underscore';
import { SpotifyPlayerServiceResult } from './results/spotifyPlayerServiceResult';
import { SpotifySyncService } from './spotifySyncService';
import { DataService } from './dataService';
import { ITrack, ISearchType } from '../adapter/spotify';
import { IPlaylistRecord } from '../data/entities/interfaces';
import { SettingsServiceResult } from './results/settingsServiceResult';
import { SpotifyServiceResult } from './results/spotifyServiceResult';


const lockSpotifyService = asyncQueue();
const lockSettingsService = asyncQueue();
const lockSpotifyPlayerService = asyncQueue();
const lockSpotifySyncService = asyncQueue();
const lockDataService = asyncQueue();

class Service {
    settingsService: ServiceResult<SettingsService, Error> = null;
    spotifyService: ServiceResult<SpotifyService, Error> = null;
    spotifyPlayerService: ServiceResult<SpotifyPlayerService, Error> = null;
    spotifySyncService: ServiceResult<SpotifySyncService, Error> = null;
    dataService: ServiceResult<DataService, Error> = null;

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
            case SpotifySyncService as any:
                return new Promise((resolve, reject) => {
                    lockSpotifySyncService.push(_.bind(async function (this: Service, next) {
                        if (this.spotifySyncService) {
                            resolve(this.spotifySyncService as any);
                            next();
                            return;
                        }

                        resolve(this.spotifySyncService = await SpotifySyncService.create(this) as any);
                        next();
                    }, this));
                });
            case DataService as any:
                return new Promise((resolve, reject) => {
                    lockDataService.push(_.bind(async function (this: Service, next) {
                        if (this.dataService) {
                            resolve(this.dataService as any);
                            next();
                            return;
                        }
    
                        resolve(this.dataService = await DataService.create(this) as any);
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
        propName: K,
        val?: SettingsService['config'][K]
    ): Promise<SettingsServiceResult<SettingsService['config'][K], Error>>;
    async settings(...args) {
        const propName = args[0];
        const val = args[1];
        const settingsResult = await this.service(SettingsService);
        if (settingsResult.isError) {

            return settingsResult;
        }
        if (args.length > 1) {
            settingsResult.val.set(propName, val);
        }

        return settingsResult.val.get(propName);
    }

    async refreshToken(newToken: string) {
        const playerResult = await this.service(SpotifyPlayerService);
        const spotifyResult = await this.service(SpotifyService);
        if (playerResult.isError) {
            return playerResult;
        }
        if (spotifyResult.isError) {
            return spotifyResult;
        }
        const newSettingsResult = await this.settings('spotify', { accessToken: newToken });
        if (newSettingsResult.isError) {
            return newSettingsResult;
        }
        const refreshSpTokenResult = await playerResult.val.refreshToken(newToken);
        if (refreshSpTokenResult.isError) {
            return refreshSpTokenResult;
        }
        const refreshPlayerTokenResult = await spotifyResult.val.refreshToken(newToken);
        if (refreshPlayerTokenResult.isError) {
            return refreshPlayerTokenResult;
        }
        return SpotifyServiceResult.success(true);
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

    async fetchArtistTopTracks(artistId: string, country = 'US') {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.fetchArtistTopTracks(artistId, country);

        return result;
    }

    async addTracks(tracks: ITrack | ITrack[]) {
        tracks = [].concat(tracks);
        const dataServiceResult = await this.service(DataService);
        if (dataServiceResult.isError) {
            return dataServiceResult;
        }
        const addTrackResult = await dataServiceResult.val.addTracks(tracks);
        if (addTrackResult.isError) {
            return addTrackResult;
        }
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.addTracks(_.map(tracks, t => t.id));

        return result;
    }

    async removeTracks(tracks: ITrack | ITrack[]) {
        tracks = [].concat(tracks);
        const dataServiceResult = await this.service(DataService);
        if (dataServiceResult.isError) {
            return dataServiceResult;
        }
        dataServiceResult.val.removeTracks(tracks);
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.removeTracks(_.map(tracks, t => t.id));

        return result;
    }

    async hasTracks(trackIds: string | string[]) {
        const service = await this.service(DataService);
        if (service.isError) {
            return service;
        }
        const result = await service.val.hasTracks(trackIds);

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
        const service = await this.service(DataService);
        if (service.isError) {
            return service;
        }

        const result = service.val.fetchMyPlaylists(offset, limit);

        return result;
    }

    async fetchPlaylistTracks(playlistId: string, offset=0, limit=20) {
        const service = await this.service(DataService);
        if (service.isError) {
            return service;
        }

        const result = service.val.fetchPlaylistTracks(playlistId, offset, limit);

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

    async search(type: ISearchType, term: string, offset = 0, limit = 20) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.search(type, term, offset, limit);

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
        const service = await this.service(DataService);
        if (service.isError) {
            return service;
        }

        const result = service.val.fetchTracks(offset, limit);

        return result;
    }

    async listPlaylistsByTrack(trackId: string) {
        const service = await this.service(DataService);
        if (service.isError) {
            return service;
        }

        const result = service.val.listPlaylistsByTrack(trackId);

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
        if (result.isError) {
            return result;
        }
        const syncServiceResult = await this.service(SpotifySyncService);
        if (syncServiceResult.isError) {
            return;
        }
        const syncPlaylistsResult = syncServiceResult.val.syncMyPlaylists();

        return syncPlaylistsResult;
    }

    async addTrackToPlaylist(tracks: ITrack | ITrack[], playlist: IPlaylistRecord) {
        const data = await this.service(DataService);
        if (data.isError) {
            return data;
        }
        const addResult = await data.val.addTracksToPlaylist(playlist, tracks);
        if (addResult.isError) {
            return;
        }
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.addTrackToPlaylist(_.map([].concat(tracks), t => t.uri), playlist.id);

        return result;
    }

    async removeTrackFromPlaylist(tracks: ITrack | ITrack[], playlistId: string) {
        const dataResult = await this.service(DataService);
        if (dataResult.isError) {
            return dataResult;
        }
        const removeResult = await dataResult.val.removeTrackFromPlaylist(playlistId, tracks);
        if (removeResult.isError) {
            return;
        }
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }
        const result = await spotify.val.removeTrackFromPlaylist(_.map([].concat(tracks), t => t.uri), playlistId);

        return result;
    }
}

export { Service, SpotifyService };
