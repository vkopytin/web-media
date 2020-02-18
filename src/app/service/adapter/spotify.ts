import * as $ from 'jquery';


export interface IUserInfo {
    birthdate?: string;
    country?: 'PL' | string;
    display_name?: string;
    email?: string;
    explicit_content?: {
        filter_enabled?: boolean;
        filter_locked?: boolean;
    };
    external_urls?: {
        spotify?: string;
    };
    followers?: {
        href?: string;
        total?: number;
    };
    href?: string;
    id?: string;
    images?: Array<any>;
    product?: 'open' | string;
    type?: 'user' | string;
    uri?: string;
};

export interface ISpotifySong {
    track: {
        id: string;
        name: string;
        album: {
            name: string;
        };
    };
    played_at: string;

}

export interface IRecentryPlayedResponse {
    items: Array<ISpotifySong>;
}

class SoptifyAdapter {

    constructor(public token: string) {

    }

    async me() {
        return new Promise<IUserInfo>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }

    recentlyPlayed() {
        return new Promise<IRecentryPlayedResponse>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/recently-played',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response:IRecentryPlayedResponse) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }
}

export { SoptifyAdapter };
