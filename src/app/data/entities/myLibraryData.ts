import * as _ from 'underscore';
import { TrackData } from './trackData';
import { ITrack } from '../../service/adapter/spotify';
import { IPlaylistData, PlaylistData } from './playlistData';
import { utils } from 'databindjs';


export interface IMyLibrary {
    id?: string;
    trackId?: string;
    track: ITrack;
    playlistId?: string;
    playlist?: IPlaylistData;
    isLiked?: boolean;
    position?: number;
    updatedTs: number;
    syncTs: number;
}

class MyLibraryData {
    uow = null;
    tableName = 'myLibrary';

	constructor(uow) {
        this.uow = uow;
    }

    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err?, result?: IMyLibrary, index?: number): void }) {
        const queue = utils.asyncQueue();
        const tracks = new TrackData(this.uow);
        const playlists = new PlaylistData(this.uow);
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                if (err) {
                    callback(err);
                    return next();
                }
                if (_.isUndefined(result)) return callback();
                tracks.getById(result.trackId, (err, track) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    if (_.isUndefined(track)) {
                        callback(err, {
                            ...result
                        });
                        return next();
                    }
                    if (result.playlistId) {
                        playlists.getById(result.playlistId, (err, playlist) => {
                            if (err) {
                                callback(err);
                                return next();
                            }
                            callback(err, {
                                ...result,
                                track,
                                playlist
                            });
                            next();
                        });
                    } else {
                        callback(err, {
                            ...result,
                            track
                        }, index);
                        next();
                    }
                });
            });
        });
    }

    eachByTrack(trackId: string, callback: { (err?, result?, index?: number): void }) {
        const queue = utils.asyncQueue();
        const tracks = new TrackData(this.uow);
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                if (err) {
                    callback(err);
                    return next();
                }
                if (_.isUndefined(result)) return callback();
                if (result.trackId !== trackId) {
                    return next();
                }
                tracks.getById(result.trackId, (err, track) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    callback(err, {
                        ...result,
                        track
                    }, result.position);
                    next();
                });
            });
        });
    }
    
    eachByPlaylist(playlistId: string, callback: { (err?, result?, index?: number): void }) {
        const queue = utils.asyncQueue();
        const tracks = new TrackData(this.uow);
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                if (err) {
                    callback(err);
                    return next();
                }
                if (_.isUndefined(result)) return callback();
                if (result.playlistId !== playlistId) {
                    return next();
                }
                tracks.getById(result.trackId, (err, track) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    callback(err, {
                        ...result,
                        track
                    }, result.position);
                    next();
                });
            });
        });
    }

    getById(id: string, callback: { (err?, result?:IMyLibrary): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.getById(this.tableName, id, (err, result) => {
            if (err) {
                callback(err);
                return;
            }
            if (_.isUndefined(result)) return callback();
            if (result === null) {
                return callback(null, null);
            }
            tracks.getById(result.trackId, (err, track) => {
                callback(err, {
                    ...result,
                    track
                });
            });
        });
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(id: string, library: IMyLibrary, callback: { (err, result?): void }) {
        const tracks = new TrackData(this.uow);
        tracks.refresh(library.track.id, {
            ...library.track,
            updatedTs: library.updatedTs,
            syncTs: library.syncTs
        }, (err, result) => {
            if (err) return callback(err);
            this.uow.create(this.tableName, {
                id,
                trackId: library.track.id,
                ..._.omit(library, 'track')
            }, callback);
        });
	}

    update(id: string, library: IMyLibrary, callback: { (err, result?): void }) {
        const tracks = new TrackData(this.uow);
        tracks.refresh(library.track.id, {
            ...library.track,
            updatedTs: library.updatedTs,
            syncTs: library.syncTs
        }, (err, result) => {
            if (err) return callback(err);
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
