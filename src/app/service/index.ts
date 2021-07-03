import { ServiceResult } from '../base/serviceResult';
import { SpotifyService } from './spotify';
import { SettingsService } from './settings';
import { SpotifyPlayerService } from './spotifyPlayer';
import { asyncQueue } from '../utils';
import * as _ from 'underscore';
import { SpotifyPlayerServiceResult } from './results/spotifyPlayerServiceResult';
import { SpotifySyncService } from './spotifySyncService';
import { DataService } from './dataService';
import { ITrack, ISearchType, IUserPlaylist } from '../adapter/spotify';
import { SettingsServiceResult } from './results/settingsServiceResult';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { LoginService } from './loginService';
import { LyricsService } from './lyricsService';


const lockSpotifyService = asyncQueue();
const lockSettingsService = asyncQueue();
const lockSpotifyPlayerService = asyncQueue();
const lockSpotifySyncService = asyncQueue();
const lockDataService = asyncQueue();
const lockLoginService = asyncQueue();
const lockLyricsServiceResult = asyncQueue();

class Service {
    settingsService: ServiceResult<SettingsService, Error> = null;
    spotifyService: ServiceResult<SpotifyService, Error> = null;
    spotifyPlayerService: ServiceResult<SpotifyPlayerService, Error> = null;
    spotifySyncService: ServiceResult<SpotifySyncService, Error> = null;
    dataService: ServiceResult<DataService, Error> = null;

    service<T extends {}, O extends {}>(
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

                        const spotifyService = await SpotifyService.create(this);
                        if (spotifyService.isError) {
                            return resolve(spotifyService as any);
                        }

                        resolve(this.spotifyService = spotifyService as any)
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

                        const settingsService = await SettingsService.create(this);
                        if (settingsService.isError) {
                            return resolve(settingsService as any);
                        }

                        resolve(this.settingsService = settingsService as any);
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

                        const spotifyPlayerService = await SpotifyPlayerService.create(this);
                        if (spotifyPlayerService.isError) {
                            return resolve(spotifyPlayerService as any);
                        }

                        resolve(this.spotifyPlayerService = spotifyPlayerService as any);
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

                        const spotifySyncService = await SpotifySyncService.create(this);
                        if (spotifySyncService.isError) {
                            return resolve(spotifySyncService as any);
                        }

                        resolve(this.spotifySyncService = spotifySyncService as any);
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

                        const dataService = await DataService.create(this);
                        if (dataService.isError) {
                            return resolve(dataService as any);
                        }
    
                        resolve(this.dataService = dataService as any);
                        next();
                    }, this));
                });
            case LoginService as any:
                return new Promise((resolve, reject) => {
                    lockLoginService.push(_.bind(async function (this: Service, next) {
                        const loginService = await LoginService.create(this);
                        if (loginService.isError) {
                            return resolve(loginService as any);
                        }
        
                        resolve(loginService as any);
                        next();
                    }, this));
                });
            case LyricsService as any:
                return new Promise((resolve, reject) => {
                    lockLyricsServiceResult.push(_.bind(async function (this: Service, next) {
                        const lyricsServiceResult = await LyricsService.create(this);
                        if (lyricsServiceResult.isError) {
                            return resolve(lyricsServiceResult as any);
                        }
            
                        resolve(lyricsServiceResult as any);
                        next();
                    }, this));
                });
            default:
                throw new Error('Unexpected service request');
        }
    }

    async isLoggedIn() {
        const loginResult = await this.service(LoginService);
        if (loginResult.isError) {
            return loginResult;
        }
        const isLoggedInResult = await loginResult.val.isLoggedIn();
        if (isLoggedInResult.isError) {
            return isLoggedInResult;
        }
        if (!isLoggedInResult.val) {
            return isLoggedInResult;
        }
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
        const stateResult = await playerResult.map(p => p.getCurrentState());

        return SpotifyPlayerServiceResult.success(stateResult);
    }

    async playerResume() {
        const player = await this.spotifyPlayer();
        return await player.map(p => p.resume());
    }

    async playerPause() {
        const player = await this.spotifyPlayer();
        return await player.map(p => p.pause());
    }
    async playerNextTrack() {
        const player = await this.spotifyPlayer();
        return await player.map(p => p.nextTrack());
    }
    async playerPreviouseTrack() {
        const player = await this.spotifyPlayer();
        return await player.map(p => p.previouseTrack());
    }

    async recentlyPlayed() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.recentlyPlayed());

        return result;
    }

    async getSpotifyAuthUrl() {
        const spotify = await this.service(LoginService);
        const result = await spotify.map(s => s.getSpotifyAuthUrl());

        return result;
    }

    async getGeniusAuthUrl() {
        const spotify = await this.service(LoginService);
        const result = await spotify.map(s => s.getGeniusAuthUrl());

        return result;
    }

    async listDevices() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(spotify => spotify.listDevices());

        return result;
    }

    async listTopTracks() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.listTopTracks());

        return result;
    }

    async fetchArtistTopTracks(artistId: string, country = 'US') {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.fetchArtistTopTracks(artistId, country));

        return result;
    }

    async addTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.addTracks(_.map(arrTracks, t => t.id)));

        return result;
    }

    async removeTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.removeTracks(_.map(arrTracks, t => t.id)));

        return result;
    }

    async hasTracks(trackIds: string | string[]) {
        const service = await this.service(SpotifyService);
        const result = await service.map(s => s.hasTracks(trackIds));

        return result;
    }

    async volume(percent) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.volume(percent));

        return result;
    }

    async profile() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.profile());

        return result;
    }

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.fetchRecommendations(
            market,
            seedArtists,
            seedTracks,
            minEnergy,
            minPopularity
        ));

        return result;
    }

    async fetchMyPlaylists(offset = 0, limit = 20) {
        const service = await this.service(SpotifyService);
        const result = await service.map(s => s.fetchMyPlaylists(offset, limit));

        return result;
    }

    async fetchPlaylistTracks(playlistId: string, offset=0, limit=20) {
        const service = await this.service(SpotifyService);
        const result = await service.map(s => s.fetchPlaylistTracks(playlistId, offset, limit));

        return result;
    }

    async listAlbumTracks(albumId) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.listAlbumTracks(albumId));

        return result;
    }

    async seek(positionMs: number, deviceId = '') {
        const spotify = await this.service(SpotifyService);
        const result = spotify.map(s => s.seek(positionMs, deviceId));

        return result;
    }

    async play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.map(s => s.play(deviceId, tracksUriList, indexOrUri));

        return result;
    }

    async pause(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.map(s => s.pause(deviceId));

        return result;
    }

    async next(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.map(s => s.next(deviceId));

        return result;
    }

    async previous(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.map(s => s.previous(deviceId));

        return result;
    }

    async newReleases() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.newReleases());

        return result;
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map( s=> s.featuredPlaylists(offset, limit, country, locale, timestamp));

        return result;
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.search(type, term, offset, limit));

        return result;
    }

    async player(deviceId='', play=null) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(spotify => spotify.player(deviceId, play));

        return result;
    }

    async currentlyPlaying() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(spotify => spotify.currentlyPlaying());

        return result;
    }

    async fetchTracks(offset = 0, limit = 20) {
        const service = await this.service(SpotifyService);
        const result = await service.map(s => s.fetchTracks(offset, limit));

        return result;
    }

    async albums(offset?, limit?) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.map(s => s.albums(offset, limit));

        return result;
    }

    async addAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.addAlbums(albumIds));

        return result;
    }

    async removeAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.removeAlbums(albumIds));

        return result;
    }

    async hasAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.hasAlbums(albumIds));

        return result;
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.createNewPlaylist(userId, name, description, isPublic));

        const syncServiceResult = await this.service(SpotifySyncService);
        const syncPlaylistsResult = syncServiceResult.map(s => s.syncMyPlaylists());

        return syncPlaylistsResult;
    }

    async addTrackToPlaylist(tracks: ITrack | ITrack[], playlist: IUserPlaylist) {
        tracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.map(s => s.addTrackToPlaylist(_.map([].concat(tracks), t => t.uri), playlist.id));
 
        const dataResult = await this.service(DataService);
        for (const track of tracks) {
            await dataResult.map(data => data.createTrack(track));
            await dataResult.map(data => data.addTrackToPlaylist(playlist, {
                added_at: new Date().toISOString(),
                track
            }));
        };

        return result;
    }

    async removeTrackFromPlaylist(tracks: ITrack | ITrack[], playlistId: string) {
        tracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);

        if (spotify.isError) {

            return spotify;
        }

        const result = await spotify.val.removeTrackFromPlaylist(_.map(tracks, t => t.uri), playlistId);
        if (result.isError) {
            return result;
        }

        const dataResult = await this.service(DataService);
        if (dataResult.isError) {
            return dataResult;
        }
        for (const track of tracks) {
            const res = await dataResult.val.removeTrackFromPlaylist(playlistId, {
                added_at: new Date().toISOString(),
                track
            });
        }

        return result;
    }

    async findTrackLyrics(songInfo: { name: string; artist: string; }) {
        const lyricsService = await this.service(LyricsService);
        if (lyricsService.isError) {
            return lyricsService;
        }
        const lyricsResult = await lyricsService.val.search(songInfo);
        return lyricsResult;
    }

    async reorderTrack(playlistId: string, oldPosition: number, newPosition: number) {
        const spotifyResult = await this.service(SpotifyService);
        if (spotifyResult.isError) {
            return spotifyResult;
        }
        const reorderSResult = await spotifyResult.val.reorderTracks(playlistId, oldPosition, newPosition, 1);
        return reorderSResult;
    }

    async bannTrack(trackId: string) {
        const dataResult = await this.service(DataService);
        if (dataResult.isError) {
            return false;
        }
        return await dataResult.val.bannTrack(trackId);
    }

    async removeBannFromTrak(trackId: string) {
        const dataResult = await this.service(DataService);
        if (dataResult.isError) {
            return false;
        }
        return await dataResult.val.removeBannFromTrack(trackId);
    }

    async isBannedTrack(trackId: string) {
        const dataResult = await this.service(DataService);
        return await dataResult.map(data => data.isBannedTrack(trackId));
    }

    async listBannedTracks(byTrackIds: string[]) {
        const dataResult = await this.service(DataService);
        return await dataResult.map(d => d.listBannedTracks(byTrackIds));
    }
}

export { Service };
