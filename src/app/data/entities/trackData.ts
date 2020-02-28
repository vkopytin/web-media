import * as _ from 'underscore';
import { ITrack } from '../../service/adapter/spotify';
import { asAsync } from '../../utils';
import { AlbumData } from './albumData';
import { ArtistData } from './artistData';
import { ArtistsToTracksData } from './artistsToTracksData';


export interface ITrackData extends ITrack {
    updatedTs: number;
    syncTs: number;
}

class TrackData {
    uow = null;
    tableName = 'tracks';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err, result?: ITrackData): void }) {
        this.uow.each(this.tableName, callback);
    }

    getById(trackId: string, callback: { (err, result?: ITrackData): void }) {
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);

        this.uow.getById(this.tableName, trackId, (err, track) => {
            if (err) {
                return callback(err);
            }
            albums.getById(track.albumId, (err, album) => {
                if (err) {
                    return callback(err);
                }
                const artistsArr = [];
                artists.eachByTrack(trackId, (err, artist) => {
                    artistsArr.push(artist);
                });
                callback(err, {
                    ...track,
                    album,
                    artists: artistsArr
                });
            });
        });
    }

	getCount(callback: { (err, result?: ITrackData): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(track: ITrackData, callback: { (err, result?: string): void }) {
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        const tasks = [];
        const trackId = track.id;
        const albumId = track.album.id;

        _.forEach(track.artists, (artist) => {
            const artistId = artist.id;
            tasks.push(asAsync(artists, artists.refresh, artist.id, {
                ...artist,
                updatedTs: track.updatedTs,
                syncTs: track.syncTs
            }));
            tasks.push(asAsync(artistsToTracks, artistsToTracks.refresh, artistId, trackId));
        });

        tasks.push(asAsync(albums, albums.refresh, albumId, track.album));

        tasks.push(asAsync(this.uow, this.uow.create, this.tableName, {
            ..._.omit(track, 'artists', 'album'),
            albumId: albumId
        }));

        Promise.all(tasks).then(() => callback(null, trackId));
	}

	update(trackId: string, track: ITrackData, callback: { (err, result?): void }) {
        const tasks = [];
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        const albumId = track.album.id;

        _.forEach(track.artists, (artist) => {
            const artistId = artist.id;
            tasks.push(asAsync(artists, artists.refresh, artist.id, {
                ...artist,
                updatedTs: track.updatedTs,
                syncTs: track.syncTs
            }));
            tasks.push(asAsync(artistsToTracks, artistsToTracks.refresh, artistId, trackId));
        });

        tasks.push(asAsync(albums, albums.refresh, albumId, track.album));

        tasks.push(asAsync(this.uow, this.uow.update, this.tableName, trackId, {
            ..._.omit(track, 'artists', 'album'),
            albumId: albumId
        }));

        Promise.all(tasks).then(() => callback(null, trackId));
	}

	delete(trackId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, trackId, callback);
    }
    
    refresh(trackId: string, track: ITrackData, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, trackId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(trackId, {
                    ...record,
                    ...track
                }, callback);
            } else {
                this.create(track, callback);
            }
        });
    }
}

export { TrackData };
