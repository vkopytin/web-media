import * as _ from 'underscore';
import { IAlbum } from '../../service/adapter/spotify';
import { asAsync } from '../../utils';
import { ArtistData } from './artistData';
import { ImageData } from './imageData';
import { AlbumToImagesData } from './albumToImagesData';
import { ArtistsToAlbumsData } from './artistsToAlbumsData';


class AlbumData {
    uow = null;
    tableName = 'albums';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

	getById(albumId, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, albumId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(album: IAlbum, callback: { (err, result?): void }) {
        const tasks = [];
        const artists = new ArtistData(this.uow);
        const images = new ImageData(this.uow);
        const albumToImages = new AlbumToImagesData(this.uow);
        const artistsToAlbums = new ArtistsToAlbumsData(this.uow);
        const albumId = album.id;

        _.forEach(album.images, (image) => {
            const imageUrl = image.url;
            tasks.push(asAsync(images, images.refresh, imageUrl, image));
            tasks.push(asAsync(albumToImages, albumToImages.refresh, imageUrl, albumId));
        });

        _.forEach(album.artists, (artist) => {
            const artistId = artist.id;
            tasks.push(asAsync(artists, artists.refresh, artist.id, artist));
            tasks.push(asAsync(artistsToAlbums, artistsToAlbums.refresh, artistId, albumId));
        });

        tasks.push(asAsync(this.uow, this.uow.create, this.tableName, {
            ..._.omit(album, 'artists', 'images')
        }))

        Promise.all(tasks).then(() => callback(null, true));
	}

	update(albumId, album: IAlbum, callback: { (err, result?): void }) {
        const tasks = [];
        const artists = new ArtistData(this.uow);
        const images = new ImageData(this.uow);
        const albumToImages = new AlbumToImagesData(this.uow);
        const artistsToAlbums = new ArtistsToAlbumsData(this.uow);

        _.forEach(album.images, (image) => {
            const imageUrl = image.url;
            tasks.push(asAsync(images, images.refresh, imageUrl, image));
            tasks.push(asAsync(albumToImages, albumToImages.refresh, imageUrl, albumId));
        });

        _.forEach(album.artists, (artist) => {
            const artistId = artist.id;
            tasks.push(asAsync(artists, artists.refresh, artist.id, artist));
            tasks.push(asAsync(artistsToAlbums, artistsToAlbums.refresh, artistId, albumId));
        });

        tasks.push(asAsync(this.uow, this.uow.update, this.tableName, albumId, {
            ..._.omit(album, 'artists', 'images')
        }))

        Promise.all(tasks).then(() => callback(null, true));
	}

	delete(albumId, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, albumId, callback);
    }

    refresh(albumId, album, callback: { (err, result?): void }) {
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
