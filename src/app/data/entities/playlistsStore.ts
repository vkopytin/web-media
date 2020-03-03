import * as _ from 'underscore';
import { IStorage, IStorageConfig } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { IPlaylistRecord } from './interfaces';


class PlaylistsStore {
    tableName = 'playlists';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'index',
            autoIncrement: true
        },
        index: {
            id: {
                id: { unique: true }
            }
        }
    };

    constructor(public storage: IStorage) {

    }

    async create(playlist: IPlaylistRecord) {
        const result = await asAsync(this.storage, this.storage.create, this.storeConfig, playlist);
        return result;
    }

    async update(playlist: IPlaylistRecord) {
        const result = await asAsync(this.storage, this.storage.update, this.storeConfig, playlist.id, playlist);
        return result;
    }

    async refresh(playlist: IPlaylistRecord) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, playlist.id);
        if (record) {
            return this.update({
                ...record,
                ...playlist
            });
        } else {
            return this.create(playlist);
        }
    }

    get(playlistId: string) {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, playlistId);
    }
    
    list(offset = 0, limit = 20) {
        return asAsyncOf(this.storage, this.storage.each, this.storeConfig);
    }

    async createTable() {
        return asAsync(this.storage, this.storage.createTable, this.storeConfig);
    }
}

export { PlaylistsStore };
