import * as $ from 'jquery';


export interface IDevice {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

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

export interface ITrack {
    id: string;
    name: string;
    album: {
        name: string;
    };
    uri: string;
    duration_ms: number;
}

export interface IUserPlaylist {
    id: string;
    name: string;
    uri: string;
    tracks: {
        total: number;
    };
    images: Array<{
        width: number;
        height: number;
        url: string;
    }>;
    owner: IUserInfo;
}

export interface ISpotifySong {
    track: ITrack;
    played_at: string;
}

export interface IRecentryPlayedResponse {
    items: Array<ISpotifySong>;
}

export interface IDevicesResponse {
    devices: IDevice[];
}

export interface IRecommendationsResult {
    tracks: ITrack[];
    seeds: Array<{}>;
}

export interface IUserPlaylistsResult {
    href: string;
    items: IUserPlaylist[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
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

    devices() {
        return new Promise<IDevicesResponse>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/devices',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response: IDevicesResponse) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }

    recommendations(market, seedArtists, seedTracks, minEnergy, minPopularity) {
        return new Promise<IRecommendationsResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/recommendations',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                data: {
                    market,
                    seed_artists: seedArtists,
                    seed_tracks: seedTracks,
                    min_energy: minEnergy,
                    min_popularity: minPopularity
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

    userPlaylists(userId) {
        return new Promise<IUserPlaylistsResult>((resolve, reject) => {
            $.ajax({
                url: `https://api.spotify.com/v1/users/${userId}/playlists`,
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

    myPlaylists() {
        return new Promise<IUserPlaylistsResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/playlists',
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

    listTracks(playlistId) {
        return new Promise<IRecentryPlayedResponse>((resolve, reject) => {
            $.ajax({
                url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
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

    playTrack(deviceId, playlistUri, trackUri) {
        return new Promise<IRecentryPlayedResponse>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    context_uri: playlistUri,
                    offeset: {
                        uri: trackUri
                    }
                }),
                success(response) {
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
