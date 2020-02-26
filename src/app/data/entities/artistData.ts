import { ArtistsToTracksData } from './artistsToTracksData';
import * as _ from 'underscore';


class ArtistData {
    uow = null;
    tableName = 'artists';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err, result?): void }) {
        this.uow.each(this.tableName, callback);
    }
    
    eachByTrack(trackId: string, callback: { (err?, result?): void }) {
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        artistsToTracks.each((err, atot) => {
            if (_.isUndefined(atot)) return callback();
            if (err) {
                callback(err);
            }
            if (atot.trackId !== trackId) {
                return;
            }
            this.getById(atot.artistId, callback);
        });
    }

	getById(artistId: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, artistId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(artist, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, artist, callback);
	}

	update(artistId: string, artist, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, artistId, artist, callback);
	}

	delete(artistId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, artistId, callback);
    }
    
    refresh(artistId: string, artist, callback: { (err, result?): void }) {
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
