import { withEvents } from 'databindjs';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { assertNoErrors } from '../utils';
import * as _ from 'underscore';
import { IResponseResult, ISpotifySong, IUserPlaylistsResult, IUserPlaylist } from '../adapter/spotify';
import { SpotifySyncServiceResult } from './results/spotifySyncServiceResult';
import { SpotifyService } from './spotify';
import { DataService } from './dataService';
import { ServiceResult } from '../base/serviceResult';


class SpotifySyncService extends withEvents(BaseService) {
    limit = 49;

    constructor(public spotify: SpotifyService, private data: DataService) {
        super();
    }

    async syncData() {
        try {
            await this.syncMyTracks();
            const playlistsResult = await this.syncMyPlaylists();
            return playlistsResult.cata(async playlists => {
                for (const playlist of playlists) {
                    await this.syncTracksByPlaylist(playlist);
                }
                this.cleanUpData();

                return SpotifySyncServiceResult.success(true);
            });
        } catch (ex) {
            return SpotifySyncServiceResult.error<boolean>(ex as Error);
        }
    }

    async syncMyPlaylists() {
        try {
            let res = [] as IUserPlaylist[];
            for await (const playlists of this.listMyPlaylists()) {
                for (const playlist of playlists) {
                    await this.data.createPlaylist(playlist);
                }
                res = [...res, ...playlists];
            }
            return SpotifySyncServiceResult.success(res);
        } catch (ex) {
            return SpotifySyncServiceResult.error<IUserPlaylist[]>(ex as Error);
        }
    }

    async syncTracksByPlaylist(playlist: IUserPlaylist) {
        let index = 0;
        for await (const songs of this.listPlaylistTracks(playlist.id)) {
            for (const song of songs) {
                await this.data.createTrack(song.track);
                await this.data.addTrackToPlaylist(playlist, song, index++);
            }
        }
    }

    async syncMyTracks() {
        let index = 0;
        const myPlaylist: IUserPlaylist = {
            id: 'myTracks',
            name: 'my Tracks',
            description: '',
            images: [],
            uri: 'my:playlist:myTracks',
            owner: {},
            snapshot_id: '0',
            tracks: {
                total: 0
            }
        };
        await this.data.createPlaylist(myPlaylist);
        for await (const songs of this.listMyTracks()) {
            for (const song of songs) {
                await this.data.createTrack(song.track);
                await this.data.addTrackToPlaylist(myPlaylist, song, index++);
            }
        }
    }

    async * listPlaylistTracks(playlistId: string) {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currentOffset = offset;
            const result = await this.spotify.fetchPlaylistTracks(playlistId, offset, this.limit + 1);
            if (assertNoErrors(result, (e: ServiceResult<unknown, Error>[]) => _.delay(() => { throw e; }))) {
                return;
            }
            const response = result.val as IResponseResult<ISpotifySong>;
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield _.map(response.items, (item, index) => ({
                position: currentOffset + index,
                ...item
            }));
        }
    }

    async * listMyPlaylists() {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currOffset = offset;
            const result = await this.spotify.fetchMyPlaylists(offset, this.limit + 1);
            if (assertNoErrors(result, (e: ServiceResult<unknown, Error>[]) => _.delay(() => { throw e; }))) {
                return;
            }
            const response = result.val as IUserPlaylistsResult;
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield _.map(response.items, (item, index) => ({
                index: currOffset + index,
                ...item
            }));
        }
    }

    async * listMyTracks() {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currentOffset = offset,
                result = await this.spotify.fetchTracks(offset, this.limit + 1);
            if (assertNoErrors(result, (e: ServiceResult<unknown, Error>[]) => _.delay(() => { throw e; }))) {
                return;
            }
            const response = result.val as IResponseResult<ISpotifySong>;
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield _.map(response.items, (item, index) => ({
                position: currentOffset + index,
                ...item
            }));
        }
    }

    async cleanUpData() {
        return true;
    }
}

export { SpotifySyncService };
