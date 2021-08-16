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
                    lockSpotifyService.push(async (next) => {
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
                    });
                });
            case SettingsService as any:
                return new Promise((resolve, reject) => {
                    lockSettingsService.push(next => {
                        if (this.settingsService) {
                            resolve(this.settingsService as any);
                            next();
                            return;
                        }

                        const settingsService = SettingsService.create(this);
                        if (settingsService.isError) {
                            resolve(settingsService as any);
                            return next();
                        }

                        resolve(this.settingsService = settingsService as any);
                        next();
                    });
                });
            case SpotifyPlayerService as any:
                return new Promise((resolve, reject) => {
                    lockSpotifyPlayerService.push(async (next) => {
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
                    });
                });
            case SpotifySyncService as any:
                return new Promise((resolve, reject) => {
                    lockSpotifySyncService.push(async (next) => {
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
                    });
                });
            case DataService as any:
                return new Promise((resolve, reject) => {
                    lockDataService.push(async (next) => {
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
                    });
                });
            case LoginService as any:
                return new Promise((resolve, reject) => {
                    lockLoginService.push(async (next) => {
                        const loginService = await LoginService.create(this);
                        if (loginService.isError) {
                            return resolve(loginService as any);
                        }
        
                        resolve(loginService as any);
                        next();
                    });
                });
            case LyricsService as any:
                return new Promise((resolve, reject) => {
                    lockLyricsServiceResult.push(async (next) => {
                        const lyricsServiceResult = await LyricsService.create(this);
                        if (lyricsServiceResult.isError) {
                            return resolve(lyricsServiceResult as any);
                        }
            
                        resolve(lyricsServiceResult as any);
                        next();
                    });
                });
            default:
                throw new Error('Unexpected service request');
        }
    }

    async isLoggedIn() {
        const loginResult = await this.service(LoginService);
        const isLoggedInResult = await loginResult.cata(s => s.isLoggedIn());
        if (!isLoggedInResult.val) {

            return isLoggedInResult;
        }

        const spotifyResult = await this.service(SpotifyService);
    
        return spotifyResult.cata(s => s.isLoggedIn());
    }

    async logout() {
        const spotifyResult = await this.service(SpotifyService);

        return spotifyResult.cata(s => s.logout());
    }

    async settings<K extends keyof SettingsService['config']>(
        propName: K,
        val?: SettingsService['config'][K]
    ): Promise<SettingsServiceResult<SettingsService['config'][K], Error>>;
    async settings(...args) {
        const propName = args[0];
        const val = args[1];
        const settingsResult = await this.service(SettingsService);
        const res = settingsResult.cata(s => {
            if (args.length > 1) {
                settingsResult.cata(s => s.set(propName, val));
            }
            return settingsResult;
        });

        return res.cata(s => s.get(propName));
    }

    async refreshToken(newToken: string) {
        const newSettingsResult = await this.settings('spotify', { accessToken: newToken });
        const spotifyResult = await newSettingsResult.cata(() => this.service(SpotifyService));
        const refreshPlayerTokenResult = await spotifyResult.cata(spotify => spotify.refreshToken(newToken));
        const playerResult = await refreshPlayerTokenResult.cata(() => this.service(SpotifyPlayerService));

        return await playerResult.cata(player => {
            player.refreshToken(newToken);

            return SpotifyServiceResult.success(true);
        });
    }

    async spotifyPlayer() {
        const playerResult = await this.service(SpotifyPlayerService);

        return playerResult;
    }

    async spotifyPlayerState() {
        const playerResult = await this.service(SpotifyPlayerService);
        const stateResult = await playerResult.cata(p => p.getCurrentState());

        return SpotifyPlayerServiceResult.success(stateResult);
    }

    async playerResume() {
        const player = await this.service(SpotifyPlayerService);
        return await player.cata(p => p.resume());
    }

    async playerPause() {
        const player = await this.service(SpotifyPlayerService);
        return await player.cata(p => p.pause());
    }
    async playerNextTrack() {
        const player = await this.service(SpotifyPlayerService);
        return await player.cata(p => p.nextTrack());
    }
    async playerPreviouseTrack() {
        const player = await this.service(SpotifyPlayerService);
        return await player.cata(p => p.previouseTrack());
    }

    async recentlyPlayed() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.recentlyPlayed());

        return result;
    }

    async getSpotifyAuthUrl() {
        const spotify = await this.service(LoginService);
        const result = await spotify.cata(s => s.getSpotifyAuthUrl());

        return result;
    }

    async getGeniusAuthUrl() {
        const spotify = await this.service(LoginService);
        const result = await spotify.cata(s => s.getGeniusAuthUrl());

        return result;
    }

    async listDevices() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(spotify => spotify.listDevices());

        return result;
    }

    async listTopTracks() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.listTopTracks());

        return result;
    }

    async fetchArtistTopTracks(artistId: string, country = 'US') {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.fetchArtistTopTracks(artistId, country));

        return result;
    }

    async addTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.addTracks(_.map(arrTracks, t => t.id)));

        return result;
    }

    async removeTracks(tracks: ITrack | ITrack[]) {
        const arrTracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.removeTracks(_.map(arrTracks, t => t.id)));

        return result;
    }

    async hasTracks(trackIds: string | string[]) {
        const service = await this.service(SpotifyService);
        const result = await service.cata(s => s.hasTracks(trackIds));

        return result;
    }

    async volume(percent) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.volume(percent));

        return result;
    }

    async profile() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.profile());

        return result;
    }

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.fetchRecommendations(
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
        const result = await service.cata(s => s.fetchMyPlaylists(offset, limit));

        return result;
    }

    async fetchPlaylistTracks(playlistId: string, offset=0, limit=20) {
        const service = await this.service(SpotifyService);
        const result = await service.cata(s => s.fetchPlaylistTracks(playlistId, offset, limit));

        return result;
    }

    async listAlbumTracks(albumId) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.listAlbumTracks(albumId));

        return result;
    }

    async seek(positionMs: number, deviceId = '') {
        const spotify = await this.service(SpotifyService);
        const result = spotify.cata(s => s.seek(positionMs, deviceId));

        return result;
    }

    async play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.cata(s => s.play(deviceId, tracksUriList, indexOrUri));

        return result;
    }

    async pause(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.cata(s => s.pause(deviceId));

        return result;
    }

    async next(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.cata(s => s.next(deviceId));

        return result;
    }

    async previous(deviceId: string = null) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.cata(s => s.previous(deviceId));

        return result;
    }

    async newReleases() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.newReleases());

        return result;
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata( s=> s.featuredPlaylists(offset, limit, country, locale, timestamp));

        return result;
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.search(type, term, offset, limit));

        return result;
    }

    async player(deviceId='', play=null) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(spotify => spotify.player(deviceId, play));

        return result;
    }

    async currentlyPlaying() {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(spotify => spotify.currentlyPlaying());

        return result;
    }

    async fetchTracks(offset = 0, limit = 20) {
        const service = await this.service(SpotifyService);
        const result = await service.cata(s => s.fetchTracks(offset, limit));

        return result;
    }

    async albums(offset?, limit?) {
        const spotify = await this.service(SpotifyService);
        const result = spotify.cata(s => s.albums(offset, limit));

        return result;
    }

    async addAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.addAlbums(albumIds));

        return result;
    }

    async removeAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.removeAlbums(albumIds));

        return result;
    }

    async hasAlbums(albumIds: string | string[]) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.hasAlbums(albumIds));

        return result;
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.createNewPlaylist(userId, name, description, isPublic));

        const syncServiceResult = await result.cata(() => this.service(SpotifySyncService));
        const syncPlaylistsResult = await syncServiceResult.cata(s => s.syncMyPlaylists());

        return syncPlaylistsResult;
    }

    async addTrackToPlaylist(tracks: ITrack | ITrack[], playlist: IUserPlaylist) {
        tracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.addTrackToPlaylist(_.map([].concat(tracks), t => t.uri), playlist.id));
 
        const dataResult = await result.cata(() => this.service(DataService));
        for (const track of tracks) {
            await dataResult.cata(data => data.createTrack(track));
            await dataResult.cata(data => data.addTrackToPlaylist(playlist, {
                added_at: new Date().toISOString(),
                track
            }));
        };

        return result;
    }

    async removeTrackFromPlaylist(tracks: ITrack | ITrack[], playlistId: string) {
        const arrTracks = [].concat(tracks);
        const spotify = await this.service(SpotifyService);
        const result = await spotify.cata(s => s.removeTrackFromPlaylist(_.map(arrTracks, t => t.uri), playlistId));

        const dataResult = await result.cata(() => this.service(DataService));
        for (const track of arrTracks) {
            await dataResult.cata(d => d.removeTrackFromPlaylist(playlistId, {
                added_at: new Date().toISOString(),
                track
            }));
        }

        return result;
    }

    async findTrackLyrics(songInfo: { name: string; artist: string; }) {
        const lyricsService = await this.service(LyricsService);
        const lyricsResult = await lyricsService.cata(s => s.search(songInfo));

        return lyricsResult;
    }

    async reorderTrack(playlistId: string, oldPosition: number, newPosition: number) {
        const spotifyResult = await this.service(SpotifyService);
        const reorderSResult = await spotifyResult.cata(s => s.reorderTracks(playlistId, oldPosition, newPosition, 1));

        return reorderSResult;
    }

    async bannTrack(trackId: string) {
        const dataResult = await this.service(DataService);
        const res = await dataResult.cata(d => d.bannTrack(trackId));

        return res;
    }

    async removeBannFromTrak(trackId: string) {
        const dataResult = await this.service(DataService);
        return await dataResult.cata(d => d.removeBannFromTrack(trackId));
    }

    async isBannedTrack(trackId: string) {
        const dataResult = await this.service(DataService);
        return await dataResult.cata(data => data.isBannedTrack(trackId));
    }

    async listBannedTracks(byTrackIds: string[]) {
        const dataResult = await this.service(DataService);
        return await dataResult.cata(d => d.listBannedTracks(byTrackIds));
    }
}

export { Service };
