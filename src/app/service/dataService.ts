import { withEvents } from 'databindjs';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import * as _ from 'underscore';
import { DataServiceResult } from './results/dataServiceResult';
import { ITrack } from '../adapter/spotify';
import { listPlaylists, listTracksByPlaylist, listMyTracks, initializeStructure, listPlaylistsByTrack, putMyTracks } from '../data/useCases';
import { DataStorage } from '../data/dataStorage';
import { PlaylistsStore } from '../data/entities/playlistsStore';
import { MyStore } from '../data/entities/myStore';
import { IPlaylistRecord } from '../data/entities/interfaces';
import * as useCases from '../data/useCases';


class DataService extends withEvents(BaseService) {
    static async create(connection: Service) {
        await initializeStructure();
        return DataServiceResult.success(new DataService(connection));
    }

    constructor(public ss: Service) {
        super();
    }

    async fetchMyPlaylists(offset = 0, limit?) {
        const total = await this.playlistsTotal();
        const playlists = await listPlaylists(offset, limit);

        return  DataServiceResult.success({
            href: '',
            items: playlists,
            limit: limit,
            next: '',
            offset: offset,
            previous: '',
            total: total
        });
    }

    async fetchPlaylistTracks(playlistId: string, offset = 0, limit?) {
        const total = await this.playlistTracksTotal(playlistId);
        const tracks = await listTracksByPlaylist(playlistId);

        return  DataServiceResult.success({
            href: '',
            items: tracks,
            limit: limit,
            next: '',
            offset: offset,
            previous: '',
            total: total
        });
    }

    async fetchPlaylistTracksFromPosition(playlistId: string, position = 0, limit?) {
        const total = await this.playlistTracksTotal(playlistId);
        const tracks = await listTracksByPlaylist(playlistId);

        return  DataServiceResult.success({
            href: '',
            items: _.reduce(_.sortBy(tracks, 'position'), (res, track) => {
                if (track.position < position) {
                    return res;
                } else if (track.position > (position + limit)) {
                    return res;
                }
                return res.concat(track);
            }, [] as typeof tracks),
            limit: limit,
            next: '',
            offset: position,
            previous: '',
            total: total
        });
    }

    async fetchTracks(offset = 0, limit?) {
        const total = 0; //await this.myTracksTotal();
        const tracks = await listMyTracks(offset, limit);

        return DataServiceResult.success({
            href: '',
            items: tracks,
            limit: limit,
            next: '',
            offset: offset,
            previous: '',
            total: total
        });
    }

    async addTracks(tracks: ITrack | ITrack[]) {
        tracks = [].concat(tracks);

        const result = await putMyTracks(_.map(tracks, t => ({
            ...t,
            added_at: new Date()
        })));

        return DataServiceResult.success(result);
    }

    removeTracks(tracks: ITrack | ITrack[]) {
        tracks = [].concat(tracks);
        return new Promise<boolean>((resolve, reject) => {
            DataStorage.create((err, storage) => {
                const myStore = new MyStore(storage);
                const tasks = _.map(tracks as ITrack[], async (track) => {
                    const newTrack = await myStore.removeTrack(track);
                    return newTrack === track;
                });
    
                Promise.all(tasks).then((result) => {
                    storage.complete();
                    resolve(!!~result.indexOf(true));
                }).catch(ex => reject(ex));
            });
        });
    }

    hasTracks(trackIds: string | string[]) {
        return new Promise<DataServiceResult<boolean[], Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                try {
                    const report = [].concat(trackIds).fill(false) as boolean[];
                    const myStore = new MyStore(storage);
                    for await (const track of myStore.listMyTracks()) {
                        const indexOf = trackIds.indexOf(track.id);
                        report[indexOf] = !!~indexOf;
                    }
                    storage.complete();
                    resolve(DataServiceResult.success(report));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    async listPlaylistsByTrack(trackId: string) {
        try {
            const playlists = await listPlaylistsByTrack(trackId);
            return DataServiceResult.success(playlists);
        } catch (ex) {
            return DataServiceResult.error(ex);
        }
    }

    async addTracksToPlaylist(playlist: IPlaylistRecord, tracks: ITrack | ITrack[]) {
        return new Promise<DataServiceResult<boolean, Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                try {
                    for (const track of [].concat(tracks)) {
                        const playlists = new PlaylistsStore(storage);
                        await playlists.addTracks(playlist, {
                            track,
                            added_at: new Date().toISOString()
                        });
                    }
                    storage.complete();
                    resolve(DataServiceResult.success(true));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    async removeTrackFromPlaylist(playlistId: string, tracks: ITrack | ITrack[]) {
        return new Promise<DataServiceResult<boolean, Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                try {
                    const playlists = new PlaylistsStore(storage);
                    for (const track of [].concat(tracks)) {
                        await playlists.removeTrack(playlistId, track.id);
                    }
                    storage.complete();
                    resolve(DataServiceResult.success(true));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    playlistTracksTotal(playlistId: string) {
        return new Promise<number>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                try {
                    const playlists = new PlaylistsStore(storage);
                    const count = playlists.tracksTotal(playlistId);

                    storage.complete();
                    resolve(count);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    playlistsTotal() {
        return new Promise<number>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                try {
                    const playlists = new PlaylistsStore(storage);
                    const count = playlists.count();

                    storage.complete();
                    resolve(count);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    myTracksTotal() {
        return new Promise<number>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                try {
                    const myStore = new MyStore(storage);
                    const count = myStore.count();

                    storage.complete();
                    resolve(count);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    reorderTrack(playlistId: string, rangeStart: number, insertBefore: number) {
        return new Promise<DataServiceResult<boolean, Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                const playlists = new PlaylistsStore(storage);
                const playlist = await playlists.get(playlistId);
                try {
                    if (rangeStart < insertBefore) {
                        const tracks = await this.fetchPlaylistTracksFromPosition(playlistId, rangeStart, insertBefore);
                        const newTracks = [...tracks.val.items];
                        const itemStart = newTracks.shift();
                        const itemBefore = newTracks.pop();
                        newTracks.push(itemStart);
                        newTracks.push(itemBefore);
                        const result = _.map(newTracks, (track, index) => ({
                            ...track,
                            position: rangeStart + index
                        }));
                        return await useCases.addTrackToPlaylist(playlist, result);
                    } else if (rangeStart > insertBefore) {
                        const tracks = await this.fetchPlaylistTracksFromPosition(playlistId, insertBefore, rangeStart);
                        const newTracks = [...tracks.val.items];
                        const itemStart = newTracks.pop();
                        const itemBefore = newTracks.shift();
                        newTracks.unshift(itemBefore);
                        newTracks.unshift(itemStart);
                        const result = _.map(newTracks, (track, index) => ({
                            ...track,
                            position: insertBefore + index
                        }));
                        return await useCases.addTrackToPlaylist(playlist, result);
                    }
                    resolve(DataServiceResult.success(true));
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }
}

export { DataService };
