import * as _ from 'underscore';
import { IStorage, IStorageConfig } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { IPlaylistRecord, ITrackRecord } from './interfaces';
import { Relation } from './relation';
import { TracksStore } from './tracksStore';
import { IMyStore } from './interfaces/iMyStore';
import { PlaylistsStore } from './playlistsStore';
import { utils } from 'databindjs';


class MyStore {
    tableName = 'my';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'id',
            autoIncrement: true
        },
        index: {
            id: {
                id: { unique: true }
            },
            added_at: {
                added_at: { }
            },
            trackId: {
                trackId: {
                    unique: true
                }
            }
        },
        orderBy: 'added_at',
        orderDesk: true
    };

    constructor(public storage: IStorage) {

    }

    createTable() {
        return asAsync(this.storage, this.storage.createTable, this.storeConfig);
    }

    create(myStore: IMyStore) {
        return asAsync(this.storage, this.storage.create, this.storeConfig, myStore);
    }

    update(myStore: IMyStore) {
        return asAsync(this.storage, this.storage.update, this.storeConfig, myStore.id, myStore);
    }

    delete(myStore: string) {
        return asAsync(this.storage, this.storage.delete, this.storeConfig, myStore);
    }

    async refresh(myStore: IMyStore) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, myStore.id);
        if (record) {
            return await this.update({
                ...record,
                ...myStore
            });
        } else {
            return await this.create(myStore);
        }
    }

    get(myStoreId: string) {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, myStoreId);
    }

    list(offset = 0, limit?) {
        return asAsyncOf(null, (cb: { (res?, result?: IMyStore, index?): boolean }) => {
            this.storage.each(this.storeConfig, (...args) => {
                const index = args[2];
                if (index < offset) {
                    return;
                }
                if (limit && ((index + 1) > (offset + limit))) {
                    return cb();
                }
                return cb(...args);
            });
        });
    }

    where(where: { [key: string]: any }) {
        return asAsyncOf(this.storage, this.storage.where, this.storeConfig, where);
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }

    async addTrack(track: ITrackRecord) {
        const tracks = new TracksStore(this.storage);
        const existinTrack = await tracks.get(track.id);
        if (!existinTrack) {
            const res = await tracks.create(track);
        }
        for await (const record of this.list()) {
            if (record.trackId === track.id) {
                return await this.refresh({
                    ...record,
                    trackId: track.id,
                    added_at: new Date(track.added_at)
                });
            }
        }
        await this.create({ trackId: track.id, added_at: new Date(track.added_at) });
        return track;
    }

    async removeTrack(track: ITrackRecord) {
        const tracks = new TracksStore(this.storage);
        const playlists = new PlaylistsStore(this.storage);
        const trackInPlaylist = await playlists.listByTrackId(track.id).next();
        if (!trackInPlaylist.value) {
            await tracks.delete(track.id);
        }
        const record = await this.getByTrackId(track.id);
        return await asAsync(this.storage, this.storage.delete, this.storeConfig, record.id);
    }

    async getByTrackId(trackId: string) {
        for await (const record of this.list(0, 1)) {
            if (record.trackId === trackId) {
                return record;
            }
        }

        return null;
    }

    async * listMyTracks(offset = 0, limit?) {
        const tracksStore = new TracksStore(this.storage);
        for await (const storeRecord of this.list(offset, limit)) {
            yield await tracksStore.get(storeRecord['trackId']);
        }
        return 'finish';
    }
}

export { MyStore };
