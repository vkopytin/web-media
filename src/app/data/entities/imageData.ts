import { PlaylistToImagesData } from './playlistToImagesData';
import * as _ from 'underscore';
import { IImageInfo } from '../../service/adapter/spotify';


export interface IImageData extends IImageInfo {

}

class ImageData {
    uow = null;
    tableName = 'images';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err, result?: IImageData): void }) {
        this.uow.each(this.tableName, callback);
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
