import { utils } from 'databindjs';


export interface ITracksPlaylistsData {
    id: string;
    trackId: string;
    playlistId: string;
    updatedTs: number;
    syncTs: number;
}


class TracksPlaylistsData {
    uow = null;
    tableName = 'tracksToPlaylists';

	constructor(uow) {
        this.uow = uow;
    }

    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    getId(trackId: string, playlistId: string) {
        return `${trackId}-${playlistId}`;
    }

    each(callback: { (err, result?: ITracksPlaylistsData, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
	}

    getById(id: string, callback: { (err, result?: ITracksPlaylistsData): void }) {
        this.uow.getById(this.tableName, id, callback);
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(trackId: string, playlistId: string, callback: { (err, result?): void }) {
        const id = this.getId(trackId, playlistId);
        this.uow.create(this.tableName, {
            id,
            trackId,
            playlistId
        }, callback);
	}

    update(trackId: string, playlistId: string, callback: { (err, result?): void }) {
        const id = this.getId(trackId, playlistId);
        this.uow.update(this.tableName, id, {
            id,
            trackId,
            playlistId
        }, callback);
	}

	delete(id: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, id, callback);
    }

    refresh(trackId: string, playlistId: string, callback: { (err, result?): void }) {
        const id = this.getId(trackId, playlistId);
        this.uow.getById(this.tableName, id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(trackId, playlistId , callback);
            } else {
                this.create(trackId, playlistId, callback);
            }
        });
    }
}

export { TracksPlaylistsData };
