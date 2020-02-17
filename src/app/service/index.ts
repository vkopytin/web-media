import { ServiceResult } from '../base/serviceResult';
import { SpotifyService } from './spotify';
import { SettingsService } from './settings';


class Service {
    async service<T extends {}, O extends {}>(
        ctor: { prototype: Partial<T> },
        options = {} as O
    ): Promise<ServiceResult<Partial<T>, Error>> {
        switch (ctor) {
            case SpotifyService as any:

                return SpotifyService.create(this) as any;
            case SettingsService as any:

                return SettingsService.create(this) as any;
            default:
                throw new Error('Unexpected service request');
        }
    }

    async isLoggedIn() {
        const spotifyResult = await this.service(SpotifyService);
        if (spotifyResult.isError) {
            return false;
        }

        return true;
    }

    async settings(key: string, val?) {
        const settingsResult = await this.service(SettingsService);
        if (settingsResult.isError) {
            return settingsResult;
        }

        return settingsResult.val.get(key);
    }
}

export { Service, SpotifyService };
