import { ServiceResult } from '../base/serviceResult';
import { SpotifyService } from './spotify';
import { SettingsService } from './settings';
import { SpotifyPlayerService } from './spotifyPlayer';


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
                if (this.spotifyService) {
                    return this.spotifyService as any;
                }

                return this.spotifyService = await SpotifyService.create(this) as any;
            case SettingsService as any:
                if (this.settingsService) {
                    return this.settingsService as any;
                }

                return this.settingsService = await SettingsService.create(this) as any;
            case SpotifyPlayerService as any:
                if (this.spotifyPlayerService) {
                    return this.spotifyPlayerService as any;
                }

                return this.spotifyPlayerService = await SpotifyPlayerService.create(this) as any;
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

    async listTracks(playlistId) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.listTracks(playlistId);

        return result;
    }

    async playerPlayTrack(deviceId, playlistUri, trackUri) {
        const spotify = await this.service(SpotifyService);
        if (spotify.isError) {
            return spotify;
        }

        const result = spotify.val.playTrack(deviceId, playlistUri, trackUri);

        return result;
    }
}

export { Service, SpotifyService };
