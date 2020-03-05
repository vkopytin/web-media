import * as _ from 'underscore';
import { IPlaylistRecord, ITrackRecord, IPlaylistTrackRecord } from '../entities/interfaces';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { PlaylistsStore } from '../entities/playlistsStore';
import { TracksStore } from '../entities/tracksStore';
import { MyStore } from '../entities/myStore';


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
                    err(ex);
                }
            });
        });
    });
}

export function putPlaylists(playlists: IPlaylistRecord[]) {
    return asAsync(() => { }, (cb: { (err, result: boolean): void }) => {
        DataStorage.create((err, storage) => {
            const playlistsStore = new PlaylistsStore(storage);
            const tasks = _.map(playlists, playlist => {
                return playlistsStore.refresh(playlist);
            });

            Promise.all(tasks).then(() => {
                storage.complete();
                cb(null, true);
            }).catch(ex => err(ex));
        });
    });
}

export function listPlaylists(offset = 0, limit?) {
    return asAsync(() => { }, (cb: { (err, result: IPlaylistRecord[]): void }) => {
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
                err(ex);
            }
        });
    });
}

export function putMyTracks(tracks: ITrackRecord[]) {
    return asAsync(() => { }, (cb: { (err, result: boolean): void }) => {
        DataStorage.create((err, storage) => {
            const myStore = new MyStore(storage);
            const tasks = _.map(tracks, async (track) => {
                return await myStore.addTrack(track);
            });

            Promise.all(tasks).then(() => {
                storage.complete();
                cb(null, true);
            }).catch(ex => err(ex));
        });
    });
}

export function listMyTracks(offset = 0, limit?) {
    return asAsync(() => { }, (cb: { (err, result: ITrackRecord[]): void }) => {
        DataStorage.create(async (err, storage) => {
            try {
                const myStore = new MyStore(storage);
                const items = [] as ITrackRecord[];
                for await (const item of myStore.listMyTracks(offset, limit)) {
                    items.push(item);
                }
                storage.complete();
                cb(null, items);
            } catch (ex) {
                err(ex);
            }
        });
    });
}

export function addTrackToPlaylist(playlistId: string, playlistTrack: IPlaylistTrackRecord[]) {
    return new Promise((resolve, reject) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlists = new PlaylistsStore(storage);
                await playlists.addTracks(playlistId, playlistTrack);
                resolve();
            } catch (ex) {
                reject(ex);
            }
        });
    });
}

export function listTracksByPlaylist(playlistId: string) {
    return new Promise<ITrackRecord[]>((resolve, reject) => {
        DataStorage.create(async (err, storage) => {
            try {
                const playlists = new PlaylistsStore(storage);
                const tracks = [] as ITrackRecord[];
                for await (const track of playlists.listTracks(playlistId)) {
                    tracks.push(track);
                }
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
                resolve(playlists);
            } catch (ex) {
                reject(ex);
            }
        });
    });
}