import * as _ from 'underscore';
import { IPlaylistRecord, ITrackRecord, IPlaylistTrackRecord } from '../entities/interfaces';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { PlaylistsStore } from '../entities/playlistsStore';
import { TracksStore } from '../entities/tracksStore';
import { MyStore } from '../entities/myStore';
import { ISongRecord } from '../entities/interfaces/iSongRecord';


export function initializeStructure() {
    return asAsync(() => { }, cb => {
        DataStorage.create((err, storage) => {
            const myStore = new MyStore(storage);
            const playlists = new PlaylistsStore(storage);
            const tracks = new TracksStore(storage);
            storage.initializeStructure(async (err, isInitializing) => {
                try {
                    if (!isInitializing) {
                        return cb(null);
                    }
                    await myStore.createTable();
                    await playlists.createTable();
                    await tracks.createTable();
                    await storage.complete();
                    cb(null, true);
                } catch (ex) {
                    cb(ex);
                }
            });
        });
    });
}

export function putPlaylists(playlists: IPlaylistRecord[]) {
    return asAsync(() => { }, (cb: { (err, result?: IPlaylistRecord[]): void }) => {
        DataStorage.create((err, storage) => {
            const playlistsStore = new PlaylistsStore(storage);
            const tasks = _.map(playlists, async playlist => {
                const currentPlaylist = await playlistsStore.get(playlist.id);
                if (currentPlaylist?.snapshot_id !== playlist.snapshot_id) {
                    await playlistsStore.refresh(playlist);
                    return playlist;
                }
                return null;
            });

            Promise.all(tasks).then((result) => {
                storage.complete();
                cb(null, _.compact(result));
            }).catch(ex => cb(ex));
        });
    });
}

export function listPlaylists(offset = 0, limit?) {
    return asAsync(() => { }, (cb: { (err, result?: IPlaylistRecord[]): void }) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlistsStore = new PlaylistsStore(storage);
                const items = [] as IPlaylistRecord[];
                for await (const item of playlistsStore.list(offset, limit)) {
                    items.push(item);
                }
                storage.complete();
                cb(null, items);
            } catch (ex) {
                cb(ex);
            }
        });
    });
}

export function putMyTracks(tracks: ITrackRecord[]) {
    return asAsync(() => { }, (cb: { (err, result?: boolean): void }) => {
        DataStorage.create((err, storage) => {
            const myStore = new MyStore(storage);
            const tasks = _.map(tracks, async (track) => {
                const newTrack = await myStore.addTrack(track);
                return newTrack === track;
            });

            Promise.all(tasks).then((result) => {
                storage.complete();
                cb(null, !!~result.indexOf(true));
            }).catch(ex => cb(ex));
        });
    });
}

export function listMyTracks(offset = 0, limit?) {
    return asAsync(() => { }, (cb: { (err, result?: ISongRecord[]): void }) => {
        DataStorage.create(async (err, storage) => {
            try {
                const items = [] as ISongRecord[];
                const myStore = new MyStore(storage)
                const tracksStore = new TracksStore(storage);
                for await (const storeRecord of myStore.list(offset, limit)) {
                    const track = await tracksStore.get(storeRecord['trackId']);
                    items.push({
                        track,
                        added_at: '' + storeRecord.added_at
                    });
                }
                storage.complete();
                cb(null, items);
            } catch (ex) {
                cb(ex);
            }
        });
    });
}

export function addTrackToPlaylist(playlistId: string, playlistTrack: IPlaylistTrackRecord | IPlaylistTrackRecord[]) {
    return new Promise((resolve, reject) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlists = new PlaylistsStore(storage);
                await playlists.addTracks(playlistId, playlistTrack);

                storage.complete();
                resolve();
            } catch (ex) {
                reject(ex);
            }
        });
    });
}

export function removeTrackFromPlaylist(playlistId: string, playlistTrackId: string | string[]) {
    return new Promise((resolve, reject) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlists = new PlaylistsStore(storage);
                for (const trackId of [].concat(playlistTrackId)) {
                    await playlists.removeTrack(playlistId, trackId);
                }
                storage.complete();
                resolve();
            } catch (ex) {
                reject(ex);
            }
        });
    });
}

export function listTracksByPlaylist(playlistId: string) {
    return new Promise<ISongRecord[]>((resolve, reject) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlistStorage = new PlaylistsStore(storage);
                const tracks = [] as ISongRecord[];
                const tracksStore = new TracksStore(storage);
                for await (const refTrack of playlistStorage.relation.where({ playlistId })) {
                    const track = await tracksStore.get(refTrack.trackId);
                    tracks.push({
                        track,
                        added_at: refTrack.added_at
                    });
                }

                storage.complete();
                resolve(tracks);
            } catch (ex) {
                reject(ex);
            }
        });
    });
}

export function listPlaylistsByTrack(trackId: string) {
    return new Promise<IPlaylistRecord[]>((resolve, reject) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlistsStore = new PlaylistsStore(storage);
                const playlists = [] as IPlaylistRecord[];
                for await (const refPlaylist of playlistsStore.listByTrackId(trackId)) {
                    playlists.push(await playlistsStore.get(refPlaylist.playlistId));
                }

                storage.complete();
                resolve(playlists);
            } catch (ex) {
                reject(ex);
            }
        });
    });
}
