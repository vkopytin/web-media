import * as _ from 'underscore';
import { IPlaylistRecord, ITrackRecord } from '../entities/interfaces';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { PlaylistsStore } from '../entities/playlistsStore';
import { TracksStore } from '../entities/tracksStore';


export function initializeStructure() {
    return asAsync(() => { }, cb => {
        DataStorage.create((err, storage) => {
            const playlists = new PlaylistsStore(storage);
            const tracks = new TracksStore(storage);
            storage.initializeStructure((err, isInitializing) => {
                if (!isInitializing) {
                    return cb(null);
                }
                playlists.createTable();
                tracks.createTable();
                storage.complete();
                cb(null, true);
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
            });
        });
    });
}

export function listPlaylists(offset = 0, limit = 20) {
    return asAsync(() => { }, (cb: { (err, result: IPlaylistRecord[]): void }) => {
        DataStorage.create(async (err, storage) => {
            const playlistsStore = new PlaylistsStore(storage);
            const items = [] as IPlaylistRecord[];
            for await (const item of playlistsStore.list(offset, limit)) {
                items.push(item);
            }
            storage.complete();
            cb(null, items);
        });
    });
}

export function putTracks(tracks: ITrackRecord[]) {
    return asAsync(() => { }, (cb: { (err, result: boolean): void }) => {
        DataStorage.create((err, storage) => {
            const tracksStore = new TracksStore(storage);
            const tasks = _.map(tracks, track => {
                return tracksStore.refresh(track);
            });

            Promise.all(tasks).then(() => {
                storage.complete();
                cb(null, true);
            });
        });
    });
}

export function listTracks(offset = 0, limit = 20) {
    return asAsync(() => { }, (cb: { (err, result: ITrackRecord[]): void }) => {
        DataStorage.create(async (err, storage) => {
            const tracksStore = new TracksStore(storage);
            const items = [] as ITrackRecord[];
            for await (const item of tracksStore.list(offset, limit)) {
                items.push(item);
            }
            storage.complete();
            cb(null, items);
        });
    });
}
