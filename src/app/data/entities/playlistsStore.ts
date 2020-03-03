import * as _ from 'underscore';
import { IStorage } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { IPlaylistRecord } from './interfaces';


class PlaylistsStore {
    tableName = 'playlists';

    constructor(public storage: IStorage) {

    }

    async create(playlist: IPlaylistRecord) {
        const result = await asAsync(this.storage, this.storage.create, this.tableName, playlist);
        return result;
    }

    async update(playlist: IPlaylistRecord) {
        const result = await asAsync(this.storage, this.storage.update, this.tableName, playlist.id, playlist);
        return result;
    }

    async refresh(playlist: IPlaylistRecord) {
        const record = await asAsync(this.storage, this.storage.getById, this.tableName, playlist.id);
        if (record) {
            return this.update(playlist);
        } else {
            return this.create(playlist);
        }
    }

    get(playlistId: string) {
        return asAsync(this.storage, this.storage.getById, this.tableName, playlistId);
    }
    
    list(offset = 0, limit = 20) {
        return asAsyncOf(this.storage, this.storage.each, this.tableName);
    }

    async createTable() {
        return asAsync(this.storage, this.storage.createTable, this.tableName);
    }
}

export { PlaylistsStore };
