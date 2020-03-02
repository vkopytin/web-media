import { ImageData } from './imageData';
import { PlaylistToImagesData } from './playlistToImagesData';
import { IUserPlaylist } from '../../service/adapter/spotify';
import * as _ from 'underscore';
import { asAsync } from '../../utils';
import { utils } from 'databindjs';


export interface IPlaylistData extends IUserPlaylist {
    updatedTs: number;
    syncTs: number;
}

class PlaylistData {
    uow = null;
    tableName = 'playlists';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err?, result?: IPlaylistData, index?: number): void }) {
        const queue = utils.asyncQueue();
        const images = new ImageData(this.uow);

        this.uow.each(this.tableName, (err, record: IPlaylistData, index: number) => {
            queue.push(next => {
                if (_.isUndefined(record)) {
                    callback();
                    return next();
                }
                if (err) {
                    callback(err);
                    return next();
                }
                const imagesArr = [];
                const playlistId = record.id;
                images.eachByPlaylistId(playlistId, (err, image) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    if (_.isUndefined(image)) {
                        callback(err, {
                            ...record,
                            images: imagesArr
                        }, index);
                        return next();
                    }
                    imagesArr.push(image);
                });
            });
        });
	}

    getById(playlistId: string, callback: { (err?, result?: IPlaylistData): void }) {
        const images = new ImageData(this.uow);

        this.uow.getById(this.tableName, playlistId, (err, record) => {
            if (err) return callback(err);
            const imagesArr = [];
            images.eachByPlaylistId(playlistId, (err, image) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (_.isUndefined(image)) return callback(err, {
                    ...record,
                    images: imagesArr
                });
                imagesArr.push(image);
            });
        });
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(playlist: IPlaylistData, callback: { (err, result?): void }) {
        const queue = utils.asyncQueue();
        const images = new ImageData(this.uow);
        const playlistToImages = new PlaylistToImagesData(this.uow);
        const playlistId = playlist.id;

        _.each(playlist.images, (image) => {
            queue.push(next => {
                const imageUrl = image.url;
                images.refresh(imageUrl, image, (err, result) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    playlistToImages.refresh(imageUrl, playlistId, (err, result) => {
                        if (err) {
                            callback(err);
                        }
                        next();
                    });
                });
            });
        });

        queue.push(next => {
            this.uow.create(this.tableName, {
                ..._.omit(playlist, 'images')
            }, (err, result) => {
                if (err) {
                    callback(err);
                }
                next();
            });
        });

        queue.push(next => {
            callback(null, true);
            next();
        });
	}

	update(playlistId: string, playlist: IPlaylistData, callback: { (err, result?): void }) {
        const queue = utils.asyncQueue();
        const images = new ImageData(this.uow);
        const playlistToImages = new PlaylistToImagesData(this.uow);

        _.each(playlist.images, (image) => {
            queue.push(next => {
                const imageUrl = image.url;
                images.refresh(imageUrl, image, (err, result) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    playlistToImages.refresh(imageUrl, playlistId, (err, result) => {
                        if (err) {
                            callback(err);
                        }
                        next();
                    });
                });
            });
        });

        queue.push(next => {
            this.uow.update(this.tableName, playlistId, {
                ..._.omit(playlist, 'images')
            }, (err, result) => {
                if (err) {
                    callback(err);
                }
                next();
            });
        });

        queue.push(next => {
            callback(null, true);
            next();
        });
	}

	delete(playlistId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, playlistId, callback);
    }
    
    refresh(playlistId: string, playlist: IPlaylistData, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, playlistId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(playlistId, {
                    ...record,
                    ...playlist
                }, callback);
            } else {
                this.create(playlist, callback);
            }
        });
    }
}

export { PlaylistData };
