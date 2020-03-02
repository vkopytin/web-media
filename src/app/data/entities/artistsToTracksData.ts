import { utils } from 'databindjs';


export interface IArtistsToTracksData {
    id: string;
    trackId: string;
    artistId: string;
    updatedTs: number;
    syncTs: number;
}

class ArtistsToTracksData {
    uow = null;
    tableName = 'artistsToTracks';

	constructor(uow) {
        this.uow = uow;
    }

    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    getId(artistId: string, trackId: string) {
        return `${artistId}-${trackId}`;
    }

    each(callback: { (err, result?: IArtistsToTracksData, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
	}

    getById(id: string, callback: { (err, result?: IArtistsToTracksData): void }) {
        this.uow.getById(this.tableName, id, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(artistId: string, trackId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, trackId);
        this.uow.create(this.tableName, {
            id,
            artistId,
            trackId
        }, callback);
	}

    update(artistId: string, trackId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, trackId);
        this.uow.update(this.tableName, id, {
            id,
            artistId,
            trackId
        }, callback);
	}

	delete(artistsToTracskId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, artistsToTracskId, callback);
    }
    
    refresh(artistId: string, trackId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, trackId);
        this.uow.getById(this.tableName, id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(artistId, trackId , callback);
            } else {
                this.create(artistId, trackId, callback);
            }
        });
    }
}

export { ArtistsToTracksData };
