import * as _ from 'underscore';
import { IStorage, IStorageConfig } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { IPlaylistRecord, IPlaylistTrackRecord } from './interfaces';
import { Relation } from './relation';
import { TracksStore } from './tracksStore';
import { MyStore } from './myStore';
import { IUserPlaylist } from '../../adapter/spotify';


class PlaylistsStore {
    tableName = 'playlists';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'index'
        },
        index: {
            id: {
                id: { unique: true }
            }
        }
    };

    relation = new Relation<{
        playlistId: string;
        trackId: string;
        added_at?: Date;
        snapshot_id?: string;
    }>(this.storage, {
        playlistId: '',
        trackId: ''
    });

    constructor(public storage: IStorage) {
        this.relation.storeConfig = {
            ...this.relation.storeConfig,
            index: {
                ...this.relation.storeConfig.index,
                added_at: {
                    added_at: {}
                }
            },
            orderBy: 'added_at'
        };
    }

    async createTable() {
        await this.relation.createTable();
        return asAsync(this.storage, this.storage.createTable, this.storeConfig);
    }

    create(playlist: IPlaylistRecord) {
        return asAsync(this.storage, this.storage.create, this.storeConfig, playlist);
    }

    update(playlist: IPlaylistRecord) {
        return asAsync(this.storage, this.storage.update, this.storeConfig, playlist.id, playlist);
    }

    delete(playlistId: string) {
        return asAsync(this.storage, this.storage.delete, this.storeConfig, playlistId);
    }

    async refresh(playlist: IPlaylistRecord) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, playlist.id);
        if (record) {
            return await this.update({
                ...record,
                ...playlist
            });
        } else {
            return await this.create(playlist);
        }
    }

    get(playlistId: string): Promise<IPlaylistRecord> {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, playlistId);
    }

    list(offset = 0, limit?) {
        return asAsyncOf(this.storage, this.storage.each as ((config: IStorageConfig, cb: (err?: any, result?: IPlaylistRecord, index?: number) => boolean) => any), this.storeConfig);
    }

    where(where: Partial<IPlaylistRecord>) {
        return asAsyncOf(this.storage, this.storage.where, this.storeConfig, where);
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }

    async addTracks(playlist: IPlaylistRecord, tracks: IPlaylistTrackRecord | IPlaylistTrackRecord[]) {
        const tracksStore = new TracksStore(this.storage);
        for (const track of [].concat(tracks) as IPlaylistTrackRecord[]) {
            await tracksStore.refresh(track.track);
            await this.relation.refresh({
                playlistId: playlist.id,
                trackId: track.track.id,
                added_at: new Date(track.added_at),
                snapshot_id: playlist.snapshot_id
            });
        }
    }

    async removeTrack(playlistId: string, trackId: string) {
        const tracks = new TracksStore(this.storage);
        const myStore = new MyStore(this.storage);
        const trackInStore = await myStore.getByTrackId(trackId);
        let trackInPlaylist = false;
        for await (const playlist of this.listByTrackId(trackId)) {
            if (playlist.playlistId !== playlistId) {
                trackInPlaylist = true;
                break;
            }
        }
        if (!trackInPlaylist && !trackInStore) {
            await tracks.delete(trackId);
        }

        return await this.relation.delete({
            playlistId,
            trackId
        });
    }

    async * listByTrackId(trackId: string) {
        for await (const record of this.relation.where({ trackId })) {
            yield record;
        }
        return null;
    }

    async * listTracks(playlistId: string) {
        const tracksStore = new TracksStore(this.storage);
        for await (const refTrack of this.relation.where({ playlistId })) {
            yield await tracksStore.get(refTrack.trackId);
        }
        return null;
    }

    async tracksTotal(playlistId: string) {
        let total = 0;
        for await (const refTrack of this.relation.where({ playlistId })) {
            total++;
        }

        return total;
    }
}

export { PlaylistsStore };
