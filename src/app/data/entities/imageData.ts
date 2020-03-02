import { PlaylistToImagesData } from './playlistToImagesData';
import * as _ from 'underscore';
import { IImageInfo } from '../../service/adapter/spotify';
import { utils } from 'databindjs';


export interface IImageData extends IImageInfo {
    updatedTs: number;
    syncTs: number;
}

class ImageData {
    uow = null;
    tableName = 'images';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err, result?: IImageData, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
    }
    
    eachByPlaylistId(playlistId: string, callback: { (err?, result?: IImageData): void }) {
        const playlistToImages = new PlaylistToImagesData(this.uow);
        playlistToImages.each((err, ptoi) => {
            if (_.isUndefined(ptoi)) return callback();
            if (err) {
                callback(err);
            }
            if (ptoi.playlistId !== playlistId) {
                return;
            }
            this.getById(ptoi.id, callback);
        });
    }

	getById(imageUrl: string, callback: { (err, result?: IImageData): void }) {
        this.uow.getById(this.tableName, imageUrl, callback);
    }

	getCount(callback: { (err, result?: IImageData): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(image, callback: { (err, result?: IImageData): void }) {
        this.uow.create(this.tableName, {
            id: image.url,
            ...image
        }, callback);
	}

	update(imageUrl: string, image, callback: { (err, result?: IImageData): void }) {
		this.uow.update(this.tableName, imageUrl, image, callback);
	}

	delete(imageUrl: string, callback: { (err, result?: IImageData): void }) {
        this.uow.delete(this.tableName, imageUrl, callback);
    }

    refresh(imageUrl: string, image, callback: { (err, result?: IImageData): void }) {
        this.uow.getById(this.tableName, imageUrl, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(imageUrl, {
                    ...record,
                    ...image
                }, callback);
            } else {
                this.create(image, callback);
            }
        });
    }
}

export { ImageData };
