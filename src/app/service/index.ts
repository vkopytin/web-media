import { SpotifyService } from './spotify';
import { SettingsService } from './settings';
import { SpotifyPlayerService } from './spotifyPlayer';
import * as _ from 'underscore';
import { SpotifySyncService } from './spotifySyncService';
import { DataService } from './dataService';
import { ITrack, ISearchType, IUserPlaylist } from '../adapter/spotify';
import { SettingsServiceResult } from './results/settingsServiceResult';
import { SpotifyServiceResult } from './results/spotifyServiceResult';
import { LoginService } from './loginService';
import { LyricsService } from './lyricsService';


class Service {
    constructor(
        private settingsService: SettingsService,
        private loginService: LoginService,
        private lyricsService: LyricsService,
        private dataService: DataService,
        private spotifyService: SpotifyService,
        private spotifySyncService: SpotifySyncService,
        private spotifyPlayerService: SpotifyPlayerService,
    ) {

    }

    async isLoggedIn() {
        const isLoggedInResult = await this.loginService.isLoggedIn();
        if (!isLoggedInResult.val) {

            return isLoggedInResult;
        }

        return this.spotifyService.isLoggedIn();
    }

    async logout() {
        return this.spotifyService.logout();
    }

    async settings<K extends keyof SettingsService['config']>(
        propName: K,
        val?: SettingsService['config'][K]
    ): Promise<SettingsServiceResult<SettingsService['config'][K], Error>>;
    async settings<K extends keyof SettingsService['config']>(...args: unknown[]) {
        const propName = args[0] as K;
        const val = args[1] as SettingsService['config'][K];
        if (args.length > 1) {
            this.settingsService.set(propName, val);
        }

        return this.settingsService.get(propName);
    }

    async refreshToken(newToken: string) {
        const newSettingsResult = await this.settings('spotify', { accessToken: newToken });
        const spotifyResult = await newSettingsResult.map(() => this.spotifyService);
        const refreshPlayerTokenResult = await spotifyResult.cata(spotify => spotify.refreshToken(newToken));
        const playerResult = await refreshPlayerTokenResult.map(() => this.spotifyPlayerService);

        return await playerResult.cata(player => {
            player.refreshToken(newToken);

            return SpotifyServiceResult.success(true);
        });
    }

    async playerResume() {
        return await this.spotifyPlayerService.resume();
    }

    async playerPause() {
        return await this.spotifyPlayerService.pause();
    }
    async playerNextTrack() {
        return await this.spotifyPlayerService.nextTrack();
    }
    async playerPreviouseTrack() {
        return await this.spotifyPlayerService.previouseTrack();
    }

    async recentlyPlayed() {
        const result = await this.spotifyService.recentlyPlayed();

        return result;
    }

    async getSpotifyAuthUrl() {
        const result = await this.loginService.getSpotifyAuthUrl();

        return result;
    }

    async getGeniusAuthUrl() {
        const result = await this.loginService.getGeniusAuthUrl();

        return result;
    }

    async listDevices() {
        const result = await this.spotifyService.listDevices();

        return result;
    }

    async listTopTracks() {
        const result = await this.spotifyService.listTopTracks();

        return result;
    }

    async fetchArtistTopTracks(artistId: string, country = 'US') {
        const result = await this.spotifyService.fetchArtistTopTracks(artistId, country);

        return result;
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

    async hasTracks(trackIds: string | string[]) {
        const result = await this.spotifyService.hasTracks(trackIds);

        return result;
    }

    async volume(percent: number) {
        const result = await this.spotifyService.volume(percent);

        return result;
    }

    async profile() {
        const result = await this.spotifyService.profile();

        return result;
    }

    async fetchRecommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50) {
        const result = await this.spotifyService.fetchRecommendations(
            market,
            seedArtists,
            seedTracks,
            minEnergy,
            minPopularity
        );

        return result;
    }

    async fetchMyPlaylists(offset = 0, limit = 20) {
        const result = await this.spotifyService.fetchMyPlaylists(offset, limit);

        return result;
    }

    async fetchPlaylistTracks(playlistId: string, offset = 0, limit = 20) {
        const result = await this.spotifyService.fetchPlaylistTracks(playlistId, offset, limit);

        return result;
    }

    async listAlbumTracks(albumId: string) {
        const result = await this.spotifyService.listAlbumTracks(albumId);

        return result;
    }

    async seek(positionMs: number, deviceId = '') {
        const result = this.spotifyService.seek(positionMs, deviceId);

        return result;
    }

    async play(deviceId?: string, tracksUriList?: string | string[], indexOrUri: number | string = '') {
        const result = this.spotifyService.play(deviceId, tracksUriList, indexOrUri);

        return result;
    }

    async pause(deviceId = '') {
        const result = this.spotifyService.pause(deviceId);

        return result;
    }

    async next(deviceId = '') {
        const result = this.spotifyService.next(deviceId);

        return result;
    }

    async previous(deviceId = '') {
        const result = this.spotifyService.previous(deviceId);

        return result;
    }

    async newReleases() {
        const result = await this.spotifyService.newReleases();

        return result;
    }

    async featuredPlaylists(offset = 0, limit = 20, country?: string, locale?: string, timestamp?: string) {
        const result = await this.spotifyService.featuredPlaylists(offset, limit, country, locale, timestamp);

        return result;
    }

    async search(type: ISearchType, term: string, offset = 0, limit = 20) {
        const result = await this.spotifyService.search(type, term, offset, limit);

        return result;
    }

    async player(deviceId = '', play: boolean | null = null) {
        const result = await this.spotifyService.player(deviceId, play);

        return result;
    }

    async currentlyPlaying() {
        const result = await this.spotifyService.currentlyPlaying();

        return result;
    }

    async fetchTracks(offset = 0, limit = 20) {
        const result = await this.spotifyService.fetchTracks(offset, limit);

        return result;
    }

    async albums(offset = 0, limit = 20) {
        const result = this.spotifyService.albums(offset, limit);

        return result;
    }

    async addAlbums(albumIds: string | string[]) {
        const result = await this.spotifyService.addAlbums(albumIds);

        return result;
    }

    async removeAlbums(albumIds: string | string[]) {
        const result = await this.spotifyService.removeAlbums(albumIds);

        return result;
    }

    async hasAlbums(albumIds: string | string[]) {
        const result = await this.spotifyService.hasAlbums(albumIds);

        return result;
    }

    async createNewPlaylist(userId: string, name: string, description = '', isPublic = false) {
        const result = await this.spotifyService.createNewPlaylist(userId, name, description, isPublic);

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
        };

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

    async findTrackLyrics(songInfo: { name: string; artist: string; }) {
        const lyricsResult = await this.lyricsService.search(songInfo);

        return lyricsResult;
    }

    async reorderTrack(playlistId: string, oldPosition: number, newPosition: number) {
        const reorderSResult = await this.spotifyService.reorderTracks(playlistId, oldPosition, newPosition, 1);

        return reorderSResult;
    }

    async bannTrack(trackId: string) {
        const res = await this.dataService.bannTrack(trackId);

        return res;
    }

    async removeBannFromTrak(trackId: string) {
        return await this.dataService.removeBannFromTrack(trackId);
    }

    async isBannedTrack(trackId: string) {
        return await this.dataService.isBannedTrack(trackId);
    }

    async listBannedTracks(byTrackIds: string[]) {
        return await this.dataService.listBannedTracks(byTrackIds);
    }
}

export { Service };
