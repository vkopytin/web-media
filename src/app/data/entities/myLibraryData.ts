import * as _ from 'underscore';
import { TrackData } from './trackData';
import { ITrack } from '../../service/adapter/spotify';


export interface IMyLibrary {
    id?: string;
    trackId?: string;
    track: ITrack;
    playlistId?: string;
    isLiked?: boolean;
    position?: number;
}

class MyLibraryData {
    uow = null;
    tableName = 'myLibrary';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

    each(callback: { (err?, result?, index?: number): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.each(this.tableName, (err, result, index) => {
            if (_.isUndefined(result)) return callback();
            tracks.getById(result.trackId, (err, track) => {
                callback(err, {
                    result,
                    track
                }, index);
            });
        });
    }
    
    eachByPlaylist(playlistId: string, callback: { (err?, result?, index?: number): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.each(this.tableName, (err, result, index) => {
            if (_.isUndefined(result)) return callback();
            if (result.playlistId !== playlistId) {
                return;
            }
            tracks.getById(result.trackId, (err, track) => {
                callback(err, {
                    ...result,
                    track
                }, result.position);
            });
        });
    }

    getById(id: string, callback: { (err, result?): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.getById(this.tableName, id, (err, result) => {
            tracks.getById(result.trackId, (err, track) => {
                callback(err, {
                    result,
                    track
                });
            });
        });
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(id: string, library, callback: { (err, result?): void }) {
        const tracks = new TrackData(this.uow);
        tracks.refresh(library.track.id, library.track, (err, result) => {
            this.uow.create(this.tableName, {
                id,
                trackId: library.track.id,
                ..._.omit(library, 'track')
            }, callback);
        });
	}

    update(id: string, library, callback: { (err, result?): void }) {
        const tracks = new TrackData(this.uow);
        tracks.refresh(library.track.id, library.track, (err, result) => {
            this.uow.update(this.tableName, id, {
                id,
                trackId: library.track.id,
                ..._.omit(library, 'track')
            }, callback);
        });
	}

	delete(id: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, id, callback);
    }

    refresh(id: string, library: IMyLibrary, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(id, library , callback);
            } else {
                this.create(id, library, callback);
            }
        });
    }
}

export { MyLibraryData };
