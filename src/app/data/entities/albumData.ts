import * as _ from 'underscore';
import { IAlbum } from '../../service/adapter/spotify';
import { asAsync } from '../../utils';
import { ArtistData } from './artistData';
import { ImageData } from './imageData';
import { AlbumToImagesData } from './albumToImagesData';
import { ArtistsToAlbumsData } from './artistsToAlbumsData';
import { utils } from 'databindjs';


export interface IAlbumRecord extends IAlbum {
    updatedTs: number;
    syncTs: number;
}

class AlbumData {
    uow = null;
    tableName = 'albums';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err?, result?: IAlbumRecord, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
    }

	getById(albumId, callback: { (err, result?: IAlbumRecord): void }) {
        this.uow.getById(this.tableName, albumId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(album: IAlbumRecord, callback: { (err, result?): void }) {
        const queue = utils.asyncQueue();
        const artists = new ArtistData(this.uow);
        const images = new ImageData(this.uow);
        const albumToImages = new AlbumToImagesData(this.uow);
        const artistsToAlbums = new ArtistsToAlbumsData(this.uow);
        const albumId = album.id;

        _.forEach(album.images, (image) => {
            queue.push(next => {
                const imageUrl = image.url;
                images.refresh(imageUrl, image, (err, result) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    albumToImages.refresh(imageUrl, albumId, (err, result) => {
                        if (err) {
                            callback(err);
                            return next();
                        }
                        next();
                    });
                });
            });
        });

        _.forEach(album.artists, (artist) => {
            queue.push(next => {
                const artistId = artist.id;
                artists.refresh(artist.id, {
                    ...artist,
                    updatedTs: album.updatedTs,
                    syncTs: album.syncTs
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    artistsToAlbums.refresh(artistId, albumId, (err, result) => {
                        if (err) {
                            callback(err);
                            return next();
                        }
                        next();
                    });
                });
            });
        });

        queue.push(next => {
            this.uow.create(this.tableName, {
                ..._.omit(album, 'artists', 'images')
            }, (err, result) => {
                if (err) {
                    callback(err);
                    return next();
                }
                next();
            });
        });

        queue.push(next => {
            callback(null, album.id);
            next();
        });
	}

	update(albumId, album: IAlbumRecord, callback: { (err?, result?): void }) {
        const queue = utils.asyncQueue();
        const artists = new ArtistData(this.uow);
        const images = new ImageData(this.uow);
        const albumToImages = new AlbumToImagesData(this.uow);
        const artistsToAlbums = new ArtistsToAlbumsData(this.uow);

        _.forEach(album.images, (image) => {
            queue.push(subNext => {
                const imageUrl = image.url;
                images.refresh(imageUrl, image, (err, result) => {
                    if (err) {
                        callback(err);
                        return subNext();
                    }
                    albumToImages.refresh(imageUrl, albumId, (err, result) => {
                        if (err) {
                            callback(err);
                            return subNext();
                        }
                        callback(null, true);
                        subNext();
                    });
                });
            });
        });

        _.forEach(album.artists, (artist) => {
            queue.push(subNext => {
                const artistId = artist.id;
                artists.refresh(artist.id, {
                    ...artist,
                    updatedTs: album.updatedTs,
                    syncTs: album.syncTs
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return subNext();
                    }
                    artistsToAlbums.refresh(artistId, albumId, (err, result) => {
                        if (err) {
                            callback(err);
                            return subNext();
                        }
                        subNext();
                    })
                });
            });
        });

        queue.push(next => {
            this.uow.update(this.tableName, albumId, {
                ..._.omit(album, 'artists', 'images')
            }, (err, result) => {
                if (err) {
                    callback(err);
                    return next();
                }
                next();
            })
        });

        queue.push(next => {
            callback(null, album.id);
            next();
        });
	}

	delete(albumId, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, albumId, callback);
    }

    refresh(albumId, album: IAlbumRecord, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, albumId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(albumId, {
                    ...record,
                    ...album
                }, callback);
            } else {
                this.create(album, callback);
            }
        });
    }
}

export { AlbumData };
