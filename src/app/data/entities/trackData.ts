import * as _ from 'underscore';
import { ITrack } from '../../service/adapter/spotify';
import { asAsync } from '../../utils';
import { AlbumData } from './albumData';
import { ArtistData } from './artistData';
import { ArtistsToTracksData } from './artistsToTracksData';
import { utils } from 'databindjs';


export interface ITrackData extends ITrack {
    updatedTs: number;
    syncTs: number;
}

class TrackData {
    uow = null;
    tableName = 'tracks';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err?, result?: ITrackData): void }) {
        const queue = utils.asyncQueue();
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);
        this.uow.each(this.tableName, (err, track) => {
            queue.push(next => {
                if (err) {
                    callback(err);
                    return next();
                }
                if (_.isUndefined(track)) {
                    callback();
                    return next();
                }
                albums.getById(track.albumId, (err, album) => {
                    const trackId = track.id;
                    if (err) {
                        callback(err);
                        return next();
                    }
                    const artistsArr = [];
                    artists.eachByTrack(trackId, (err, artist) => {
                        if (_.isUndefined(artist)) {
                            callback(err, {
                                ...track,
                                album,
                                artists: artistsArr
                            });
                            return next();
                        }
                        artistsArr.push(artist);
                    });
                });
            });
        });
    }

    getById(trackId: string, callback: { (err?, result?: ITrackData): void }) {
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);

        this.uow.getById(this.tableName, trackId, (err, track) => {
            if (err) {
                return callback(err);
            }
            if (_.isUndefined(track)) {
                return callback();
            }
            albums.getById(track.albumId, (err, album) => {
                if (err) {
                    return callback(err);
                }
                const artistsArr = [];
                artists.eachByTrack(trackId, (err, artist) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (_.isUndefined(artist)) {
                        return callback(err, {
                            ...track,
                            album,
                            artists: artistsArr
                        });
                    }
                    artistsArr.push(artist);
                });
            });
        });
    }

	getCount(callback: { (err, result?: ITrackData): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(track: ITrackData, callback: { (err, result?: string): void }) {
        const queue = utils.asyncQueue();
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        const trackId = track.id;
        const albumId = track.album.id;

        _.forEach(track.artists, (artist) => {
            queue.push(next => {
                const artistId = artist.id;
                artists.refresh(artist.id, {
                    ...artist,
                    updatedTs: track.updatedTs,
                    syncTs: track.syncTs
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    artistsToTracks.refresh(artistId, trackId, (err, result) => {
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
            albums.refresh(albumId, {
                ...track.album,
                updatedTs: track.updatedTs,
                syncTs: track.syncTs
            }, (err, result) => {
                if (err) {
                    callback(err);
                    return next();
                }
                next();
            });
        });

        queue.push(next => {
            this.uow.create(this.tableName, {
                ..._.omit(track, 'artists', 'album'),
                albumId: albumId
            }, (err, result) => {
                if (err) {
                    callback(err);
                    return next();
                }
                next();
            });
        });

        queue.push(next => {
            callback(null, track.id);
            next();
        });
	}

	update(trackId: string, track: ITrackData, callback: { (err, result?): void }) {
        const queue = utils.asyncQueue();
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        const albumId = track.album.id;

        _.forEach(track.artists, (artist) => {
            queue.push(next => {
                const artistId = artist.id;
                artists.refresh(artist.id, {
                    ...artist,
                    updatedTs: track.updatedTs,
                    syncTs: track.syncTs
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        next();
                        return;
                    }
                    artistsToTracks.refresh(artistId, trackId, (err, result) => {
                        if (err) {
                            callback(err);
                            next();
                            return;
                        }
                        next();
                    });
                });
            });
        });

        queue.push(next => {
            albums.refresh(albumId, {
                ...track.album,
                updatedTs: track.updatedTs,
                syncTs: track.syncTs
            }, (err, result) => {
                if (err) {
                    callback(err);
                    next();
                    return;
                }
                next();
            });
        });

        queue.push(next => {
            this.uow.update(this.tableName, trackId, {
                ..._.omit(track, 'artists', 'album'),
                albumId: albumId
            }, (err, result) => {
                if (err) {
                    callback(err);
                    next();
                    return;
                }
                next();
            });
        });

        queue.push(next => {
            callback(null, track.id);
            next();
        });
	}

    delete(trackId: string, callback: { (err?, result?): void }) {
        const queue = utils.asyncQueue();
        const albums = new AlbumData(this.uow);
        const artists = new ArtistData(this.uow);
        const artistsToTracks = new ArtistsToTracksData(this.uow);
        this.getById(trackId, (err, track) => {
            if (err) {
                callback();
            }
            const albumId = track.album.id;

            _.forEach(track.artists, (artist) => {
                queue.push(next => {
                    const artistId = artist.id;
                    let exists = false;
                    artists.eachByTrack(trackId, (err, curTrack) => {
                        if (_.isUndefined(curTrack)) {
                            exists || artists.delete(artist.id, (err, result) => {
                                const atotId = artistsToTracks.getId(artistId, trackId);
                                artistsToTracks.delete(atotId, (err, result) => {
                                    next();
                                });
                            });
                            exists && next();
                            return;
                        }
                        if (curTrack.id !== trackId) {
                            exists = true;
                        }
                    });
                });

                queue.push(next => {
                    let exists = false;
                    this.each((err, currTrack) => {
                        if (_.isUndefined(currTrack)) {
                            exists || albums.delete(albumId, (err, result) => {
                                if (err) {
                                    callback(err);
                                    next();
                                    return;
                                }
                                next();
                            });
                            exists && next();
                            return;
                        }
                        if (trackId !== currTrack.id) {
                            if (currTrack.album && currTrack.album.id === albumId) {
                                exists = true;
                            }
                        }
                    });
                });
            });

            queue.push(next => {
                this.uow.delete(this.tableName, trackId, callback);
                next();
            });
        });
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
