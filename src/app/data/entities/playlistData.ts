import { ImageData } from './imageData';
import { PlaylistToImagesData } from './playlistToImagesData';
import { IUserPlaylist } from '../../service/adapter/spotify';
import * as _ from 'underscore';
import { asAsync } from '../../utils';


export interface IPlaylistData extends IUserPlaylist {
    updatedTs: number;
    syncTs: number;
}

class PlaylistData {
    uow = null;
    tableName = 'playlists';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err?, result?: IPlaylistData, index?: number): void }) {
        const images = new ImageData(this.uow);

        this.uow.each(this.tableName, (err, record: IPlaylistData, index: number) => {
            if (_.isUndefined(record)) return callback();
            if (err) {
                callback(err);
            }
            const imagesArr = [];
            const playlistId = record.id;
            images.eachByPlaylistId(playlistId, (err, image) => {
                imagesArr.push(image);
            });
            callback(err, {
                ...record,
                images: imagesArr
            }, index);
        });
	}

    getById(playlistId: string, callback: { (err?, result?: IPlaylistData): void }) {
        const images = new ImageData(this.uow);

        this.uow.getById(this.tableName, playlistId, (err, record) => {
            const imagesArr = [];
            images.eachByPlaylistId(playlistId, (err, image) => {
                if (_.isUndefined(image)) return callback();
                imagesArr.push(image);
            });
            callback(err, {
                ...record,
                images: imagesArr
            });
        });
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(playlist: IPlaylistData, callback: { (err, result?): void }) {
        const tasks = [];
        const images = new ImageData(this.uow);
        const playlistToImages = new PlaylistToImagesData(this.uow);
        const playlistId = playlist.id;

        _.each(playlist.images, (image) => {
            const imageUrl = image.url;
            tasks.push(asAsync(images, images.refresh, imageUrl, image));
            tasks.push(asAsync(playlistToImages, playlistToImages.refresh, imageUrl, playlistId));
        });

        tasks.push(asAsync(this.uow, this.uow.create, this.tableName, {
            ..._.omit(playlist, 'images')
        }));

        Promise.all(tasks).then(() => callback(null, true));
	}

	update(playlistId: string, playlist: IPlaylistData, callback: { (err, result?): void }) {
        const tasks = [];
        const images = new ImageData(this.uow);
        const playlistToImages = new PlaylistToImagesData(this.uow);

        _.each(playlist.images, (image) => {
            const imageUrl = image.url;
            tasks.push(asAsync(images, images.refresh, imageUrl, image));
            tasks.push(asAsync(playlistToImages, playlistToImages.refresh, imageUrl, playlistId));
        });

        tasks.push(asAsync(this.uow, this.uow.update, this.tableName, playlistId, {
            ..._.omit(playlist, 'images')
        }));

        Promise.all(tasks).then(() => callback(null, true));
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
