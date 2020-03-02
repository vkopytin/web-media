import { ArtistsToTracksData } from './artistsToTracksData';
import * as _ from 'underscore';
import { IArtist } from '../../service/adapter/spotify';
import { utils } from 'databindjs';


export interface IArtistRecord extends IArtist {
    updatedTs: number;
    syncTs: number;
}

class ArtistData {
    uow = null;
    tableName = 'artists';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err?, result?: IArtistRecord, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
    }
    
    eachByTrack(trackId: string, callback: { (err?, result?: IArtistRecord): void }) {
        const queue = utils.asyncQueue();
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        artistsToTracks.each((err, atot) => {
            queue.push(next => {
                if (_.isUndefined(atot)) {
                    callback();
                    return next();
                }
                if (err) {
                    callback(err);
                    return next();
                }
                if (atot.trackId !== trackId) {
                    return next();
                }
                this.getById(atot.artistId, (err, result) => {
                    callback(err, result);
                    next();
                });
            });
        });
    }

	getById(artistId: string, callback: { (err, result?: IArtistRecord): void }) {
        this.uow.getById(this.tableName, artistId, callback);
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(artist: IArtistRecord, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, artist, callback);
	}

	update(artistId: string, artist: IArtistRecord, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, artistId, artist, callback);
	}

	delete(artistId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, artistId, callback);
    }
    
    refresh(artistId: string, artist: IArtistRecord, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, artistId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(artistId, {
                    ...record,
                    ...artist
                }, callback);
            } else {
                this.create(artist, callback);
            }
        });
    }
}

export { ArtistData };
