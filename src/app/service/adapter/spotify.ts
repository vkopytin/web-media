import * as $ from 'jquery';


export interface IImageInfo {
    width: number;
    height: number;
    url: string;
};

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
    album: IAlbum;
    uri: string;
    duration_ms: number;
    track_number: number;
}

export interface IArtist {
    external_urls: {
        spotify: string;
    };
    spotify: string;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface IUserPlaylist {
    id: string;
    name: string;
    uri: string;
    tracks: {
        total: number;
    };
    images: Array<IImageInfo>;
    owner: IUserInfo;
}

export interface ISpotifySong {
    track: ITrack;
    played_at: string;
}

export interface IDevicesResponse {
    devices: IDevice[];
}

export interface IRecommendationsResult {
    tracks: ITrack[];
    seeds: Array<{}>;
}

export interface IAlbum {
    id: string;
    name: string;
    uri: string;
    artists: IArtist[];
    images: Array<IImageInfo>;
    total_tracks: number;
    release_date: string;
    external_urls: {
        spotify: string;
    };
}

export interface IResponseResult<T> {
    href: string;
    items: T[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
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

export interface IPlayerResult {
    device: IDevice;
    shuffle_state: boolean;
    repeat_state: 'off' | string;
    timestamp: number;
    context: {};
    progress_ms: number;
    item: ITrack;
    currently_playing_type: 'track' | string;
    actions: {
        disallows: {
            resuming: boolean;
        }
    };
    is_playing: boolean;
}

export interface ICurrentlyPlayingResult {
    timestamp: number;
    context: {};
    progress_ms: number;
    item: ITrack;
    currently_playing_type: 'track' | string;
    actions: {
        disallows: {
            resuming: boolean;
        }
    };
    is_playing: boolean;
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
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/recently-played',
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

    listPlaylistTracks(playlistId) {
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
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

    listAlbumTracks(albumId) {
        return new Promise<IResponseResult<ITrack>>((resolve, reject) => {
            $.ajax({
                url: `https://api.spotify.com/v1/albums/${albumId}/tracks`,
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

    play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        const urlParts = ['https://api.spotify.com/v1/me/player/play'];
        deviceId && urlParts.push($.param({
            device_id: deviceId
        }));
        const numberRx = /^\d+$/i;
        const position = numberRx.test('' + indexOrUri) ? +indexOrUri : -1;
        const uri = (!numberRx.test('' + indexOrUri)) ? indexOrUri : '';
        const uris = [].concat(tracksUriList);
        const contextUri = uris.length === 1 ? uris[0] : '';
        return new Promise<any>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify((tracksUriList && tracksUriList.length) ? {
                    ...contextUri ? { context_uri: contextUri } : { uris },
                    offset: {
                        ...uri ? { uri } : { position }
                    }
                } : {}),
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }

    next(deviceId: string = '') {
        const urlParts = ['https://api.spotify.com/v1/me/player/next'];
        deviceId && urlParts.push($.param({
            device_id: deviceId
        }));
        return new Promise<any>((resolve, reject) => {
            $.ajax({
                method: 'POST',
                url: urlParts.join('?'),
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

    previous(deviceId: string = '') {
        const urlParts = ['https://api.spotify.com/v1/me/player/previous'];
        deviceId && urlParts.push($.param({
            device_id: deviceId
        }));
        return new Promise<any>((resolve, reject) => {
            $.ajax({
                method: 'POST',
                url: urlParts.join('?'),
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

    pause(deviceId: string = '') {
        const urlParts = ['https://api.spotify.com/v1/me/player/pause'];
        deviceId && urlParts.push($.param({
            device_id: deviceId
        }));
        return new Promise<any>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: urlParts.join('?'),
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

    newReleases() {
        return new Promise<IResponseResult<IAlbum>>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/browse/new-releases',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response) {
                    resolve(response.albums);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }

    search(term, offset = 0, limit = 20) {
        return new Promise<IResponseResult<IAlbum>>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/search',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                data: {
                    q: term,
                    type: 'track',
                    ...offset ? { offset: offset } : {},
                    limit: limit
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

    player(deviceId='', play=null as boolean) {
        return new Promise<IPlayerResult>((resolve, reject) => {
            $.ajax({
                method: play===null ? 'GET': 'PUT',
                url: 'https://api.spotify.com/v1/me/player',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                ...play === null ? {} : {
                    contentType: 'application/json',
                    data: JSON.stringify({
                        device_ids: [].concat(deviceId),
                        play: play
                    })
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

    seek(positionMs, deviceId='') {
        return new Promise<IPlayerResult>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: 'https://api.spotify.com/v1/me/player/seek?' + $.param({
                    position_ms: positionMs,
                    ...deviceId ? { device_id: deviceId } : {}
                }),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({}),
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(new Error(`${textStatus}:${errorThrown}`));
                }
            });
        });
    }

    currentlyPlaying() {
        return new Promise<ICurrentlyPlayingResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/currently-playing',
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

    tracks(offset = 0, limit = 20) {
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/tracks',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                data: {
                    offset: offset,
                    limit: limit
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

    volume(precent, deviceId?) {
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: 'https://api.spotify.com/v1/me/player/volume?' + $.param({
                    volume_percent: precent,
                    ...deviceId ? { device_id: deviceId } : {}
                }),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({}),
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
