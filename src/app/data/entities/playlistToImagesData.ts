import { utils } from 'databindjs';


export interface IPlaylistToImagesData {
    id: string;
    playlistId: string;
    updatedTs: number;
    syncTs: number;
}

class PlaylistToImagesData {
    uow = null;
    tableName = 'playlistToImages';

	constructor(uow) {
        this.uow = uow;
    }

    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err, result?: IPlaylistToImagesData, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
	}

    getById(imageUrl: string, callback: { (err, result?: IPlaylistToImagesData): void }) {
        this.uow.getById(this.tableName, imageUrl, callback);
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(imageUrl: string, playlistId: string, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, {
            id: imageUrl,
            playlistId
        }, callback);
	}

    update(imageUrl: string, playlistId: string, callback: { (err, result?): void }) {
        this.uow.update(this.tableName, imageUrl, {
            id: imageUrl,
            playlistId
        }, callback);
	}

	delete(imageUrl: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, imageUrl, callback);
    }
    
    refresh(imageUrl: string, playlistId: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, imageUrl, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(imageUrl, playlistId, callback);
            } else {
                this.create(imageUrl, playlistId, callback);
            }
        });
    }
}

export { PlaylistToImagesData };
