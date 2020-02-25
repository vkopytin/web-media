import * as $ from 'jquery';
import { ErrorWithStatus } from './errors/errorWithStatus';
import { resolve } from 'dns';

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
    artists: IArtist[];
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
    album_type: string;
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

const delayWithin = (ms = 800) => new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
});

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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    devices() {
        const ready = delayWithin();
        return new Promise<IDevicesResponse>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/devices',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response: IDevicesResponse) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    recommendations(market: string, seedArtists: string | string[], seedTracks: string | string[], minEnergy = 0.4, minPopularity = 50, limit = 0) {
        return new Promise<IRecommendationsResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/recommendations',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                data: {
                    market,
                    seed_artists: [].concat(seedArtists).join(','),
                    seed_tracks: [].concat(seedTracks).join(','),
                    min_energy: minEnergy,
                    min_popularity: minPopularity,
                    limit
                },
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    myPlaylists(offset=0, limit=20) {
        return new Promise<IUserPlaylistsResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/playlists',
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    listPlaylistTracks(playlistId, offset=0, limit=20) {
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    myTopTracks() {
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                url: `https://api.spotify.com/v1/me/top/tracks`,
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    play(deviceId: string = null, tracksUriList: string | string[] = null, indexOrUri: number | string = null) {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    next(deviceId: string = '') {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    previous(deviceId: string = '') {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    pause(deviceId: string = '') {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    player(deviceId = '', play = null as boolean) {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    seek(positionMs, deviceId = '') {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    currentlyPlaying() {
        const ready = delayWithin();
        return new Promise<ICurrentlyPlayingResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/currently-playing',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    albums(offset = 0, limit = 20) {
        return new Promise<IResponseResult<IAlbum>>((resolve, reject) => {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/albums',
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
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    addTracks(trackIds: string | string[]) {
        const ready = delayWithin();
        const urlParts = ['https://api.spotify.com/v1/me/tracks'];
        urlParts.push($.param({
            ids: [].concat(trackIds).join(',')
        }));
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({}),
                success(response) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    removeTracks(trackIds: string | string[]) {
        const ready = delayWithin();
        const urlParts = ['https://api.spotify.com/v1/me/tracks'];
        urlParts.push($.param({
            ids: [].concat(trackIds).join(',')
        }));
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                method: 'DELETE',
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({}),
                success(response) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    hasTracks(trackIds: string | string[]) {
        const ready = delayWithin();
        const urlParts = ['https://api.spotify.com/v1/me/tracks/contains'];
        urlParts.push($.param({
            ids: [].concat(trackIds).join(',')
        }));
        return new Promise<boolean[]>((resolve, reject) => {
            $.ajax({
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response: boolean[]) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    volume(precent, deviceId?) {
        const ready = delayWithin();
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
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    addAlbums(albumIds: string | string[]) {
        const ready = delayWithin();
        const urlParts = ['https://api.spotify.com/v1/me/albums'];
        urlParts.push($.param({
            ids: [].concat(albumIds).join(',')
        }));
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({}),
                success(response) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    removeAlbums(albumIds: string | string[]) {
        const ready = delayWithin();
        const urlParts = ['https://api.spotify.com/v1/me/albums'];
        urlParts.push($.param({
            ids: [].concat(albumIds).join(',')
        }));
        return new Promise<IResponseResult<ISpotifySong>>((resolve, reject) => {
            $.ajax({
                method: 'DELETE',
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                contentType: 'application/json',
                data: JSON.stringify({}),
                success(response) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }

    hasAlbums(albumIds: string | string[]) {
        const ready = delayWithin();
        const urlParts = ['https://api.spotify.com/v1/me/albums/contains'];
        urlParts.push($.param({
            ids: [].concat(albumIds).join(',')
        }));
        return new Promise<boolean[]>((resolve, reject) => {
            $.ajax({
                url: urlParts.join('?'),
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                success(response: boolean[]) {
                    ready.then(() => resolve(response));
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }
}

export { SoptifyAdapter };
