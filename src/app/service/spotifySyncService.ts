import { withEvents } from 'databindjs';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { assertNoErrors } from '../utils';
import * as _ from 'underscore';
import { IResponseResult, ISpotifySong, IUserPlaylistsResult, IUserPlaylist } from '../adapter/spotify';
import { SpotifySyncServiceResult } from './results/spotifySyncServiceResult';
import { putMyTracks, putPlaylists, addTrackToPlaylist } from '../data/useCases';
import { SpotifyService } from './spotify';
import { DataService } from './dataService';


class SpotifySyncService extends withEvents(BaseService) {
    static async create(connection: Service) {
        const dataServiceResult = await connection.service(DataService);
        if (dataServiceResult.isError) {
            return dataServiceResult;
        }
        const spotifyResult = await connection.service(SpotifyService);
        if (spotifyResult.isError) {
            return spotifyResult;
        }
        const spotify = spotifyResult.val;
        return SpotifySyncServiceResult.success(new SpotifySyncService(connection, spotify));
    }

    limit = 49;

    constructor(public ss: Service, public spotify: SpotifyService) {
        super();
    }

    async syncData() {
        await this.syncMyTracks();
        const playlists = await this.syncMyPlaylists();
        for (const playlist of playlists) {
            await this.syncTracksByPlaylist(playlist);
        }
        this.cleanUpData();
    }

    async syncMyPlaylists() {
        let res = [] as IUserPlaylist[];
        for await (const playlists of this.listMyPlaylists()) {
            const uptatedPlaylists = await putPlaylists(playlists);
            res = res.concat(uptatedPlaylists);
        }
        return res;
    }

    async syncTracksByPlaylist(playlist: IUserPlaylist) {
        for await (const tracks of this.listPlaylistTracks(playlist.id)) {
            await addTrackToPlaylist(playlist, tracks);
        }
    }

    async syncMyTracks() {
        for await (const songs of this.listMyTracks()) {
            const syncMore = await putMyTracks(_.map(songs, song => ({
                added_at: new Date(song.added_at),
                ...song.track
            })));
            if (!syncMore) {
                break;
            }
        }
    }

    async * listPlaylistTracks(playlistId: string) {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const result = await this.spotify.fetchPlaylistTracks(playlistId, offset, this.limit + 1);
            if (assertNoErrors(result, e => _.delay(() => { throw e; }))) {
                return;
            }
            const response = result.val as IResponseResult<ISpotifySong>;
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield response.items;
        }
    }

    async * listMyPlaylists() {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currOffset = offset;
            const result = await this.spotify.fetchMyPlaylists(offset, this.limit + 1);
            if (assertNoErrors(result, e => _.delay(() => { throw e; }))) {
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
            const result = await this.spotify.fetchTracks(offset, this.limit + 1);
            if (assertNoErrors(result, e => _.delay(() => { throw e; }))) {
                return;
            }
            const response = result.val as IResponseResult<ISpotifySong>;
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield response.items;
        }
    }

    async cleanUpData() {
        return true;
    }
}

export { SpotifySyncService };
