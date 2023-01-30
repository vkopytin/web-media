import { IResponseResult, ISpotifySong } from '../ports/iMediaProt';
import { ICurrentlyPlayingResult, IDevicesResponse, IPLayerQueueResult, IPlayerResult, IRemotePlaybackPort } from '../ports/iRemotePlaybackPort';
import { ErrorWithStatus } from './errors/errorWithStatus';

const delayWithin = (ms = 800) => new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
});

const resultOrError = async <T,>(response: Response): Promise<T> => {
    if ([200, 202, 204].indexOf(response.status) !== -1) {
        const text = await response.text();
        if (!text) {
            return text as T;
        }
        try {
            return JSON.parse(text);
        } catch (ex) {
            return text as T;
        }
    } else if (response.status > 200 && response.status < 300) {
        return undefined as T;
    } else {
        const result = await response.text();
        const res = JSON.parse(result);

        if (!(typeof (res) === 'object' && 'error' in res)) {
            throw new ErrorWithStatus(result, response.status, response.statusText);
        }

        const error = res.error;
        if (!(typeof (error) === 'object' && 'message' in error)) {
            throw new ErrorWithStatus(error, response.status, response.statusText);
        }

        throw new ErrorWithStatus(error.message, response.status, response.statusText, res);
    }
}

const toString = (obj: { toString?: () => string }) => {
    try {
        if (typeof obj === 'undefined') {
            return '';
        }
        if (obj === null) {
            return '';
        }
        if (typeof obj === 'number') {
            return '' + obj;
        }
        if (typeof obj === 'string') {
            return obj;
        }

        if ('toString' in obj) {
            return obj.toString?.();
        }

        return '' + obj;
    } catch (ex) {
        console.log(ex);
    }
};
const toUrlQueryParams = (obj: object) => Object.entries(obj)
    .map(([key, value]) => [key, toString(value)])
    .map(([key, value]) => `${key}=${encodeURIComponent(value || '')}`)
    .join('&');

const baseUrl = 'https://api.spotify.com';

//let index = 0;

export class SpotifyRemotePlaybackAdapter implements IRemotePlaybackPort {
    fetch: typeof fetch = async (input, init) => {
        //if (index++ % 3 === 0) {
        //    input = ('' + input).replace('?', '/fail?') + 'fail';
        //}
        return await fetch(input, init);
    }

    constructor(public token: string) {

    }

    async recentlyPlayed(before = new Date() as Date | number, limit = 20): Promise<IResponseResult<ISpotifySong>> {
        before = +before;
        const response = await this.fetch(`${baseUrl}/v1/me/player/recently-played?` + toUrlQueryParams({
            before, limit
        }), {
            headers: {
                'Authorization': 'Bearer ' + this.token
            }
        });

        return await resultOrError<IResponseResult<ISpotifySong>>(response);
    }

    async devices(): Promise<IDevicesResponse> {
        await delayWithin();

        const response = await this.fetch(`${baseUrl}/v1/me/player/devices`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError<IDevicesResponse>(response);
    }

    async play(tracksUriList?: string | string[], indexOrUri: number | string = '', deviceId?: string): Promise<void> {
        const urlParts = [`${baseUrl}/v1/me/player/play`];
        const numberRx = /^\d+$/i;
        const position = numberRx.test('' + indexOrUri) ? +indexOrUri : -1;
        const uri = (!numberRx.test('' + indexOrUri)) ? indexOrUri : '';
        const uris = ([] as string[]).concat(tracksUriList || []);
        const contextUri = uris.length === 1 ? uris[0] : '';
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify((tracksUriList && tracksUriList.length) ? {
                ...contextUri ? { context_uri: contextUri } : { uris },

                ...uri ? { offset: { uri } }
                    : position !== -1 ? { offset: { position } }
                        : {}
            } : {}),
        });

        return await resultOrError(response);
    }

    async next(deviceId = ''): Promise<unknown> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/player/next`];
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async previous(deviceId = ''): Promise<unknown> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/player/previous`];
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async pause(deviceId = ''): Promise<unknown> {
        await delayWithin();
        const urlParts = [`${baseUrl}/v1/me/player/pause`];
        deviceId && urlParts.push(`device_id=${encodeURIComponent(deviceId)}`);

        const response = await this.fetch(urlParts.join('?'), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async player(deviceId = '', play = null as boolean | null): Promise<IPlayerResult> {
        await delayWithin();
        const response = await this.fetch(`${baseUrl}/v1/me/player`, {
            method: play === null ? 'GET' : 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            ...play === null ? {} : {
                body: JSON.stringify({
                    device_ids: ([] as string[]).concat(deviceId),
                    play: play
                })
            }
        });

        return await resultOrError(response);
    }

    async seek(positionMs: number, deviceId = ''): Promise<void> {
        const response = await this.fetch(`${baseUrl}/v1/me/player/seek?` + toUrlQueryParams({
            position_ms: positionMs,
            ...deviceId ? { device_id: deviceId } : {}
        }), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async currentlyPlaying(): Promise<ICurrentlyPlayingResult> {
        const response = await this.fetch(`${baseUrl}/v1/me/player/currently-playing`, {
            headers: {
                'Authorization': 'Bearer ' + this.token
            },
        });

        return await resultOrError(response);
    }

    async volume(precent: number, deviceId?: string): Promise<IResponseResult<ISpotifySong>> {

        const response = await this.fetch(`${baseUrl}/v1/me/player/volume?` + toUrlQueryParams({
            volume_percent: precent,
            ...deviceId ? { device_id: deviceId } : {}
        }), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        return await resultOrError(response);
    }

    async queue(): Promise<IPLayerQueueResult> {
        const response = await this.fetch(`${baseUrl}/v1/me/player/queue`, {
            headers: {
                'Authorization': 'Bearer ' + this.token,
            },
        });

        return await resultOrError(response);
    }
}
