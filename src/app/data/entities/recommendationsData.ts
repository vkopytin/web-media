import { IRecommendationsResult, ITrack } from '../../service/adapter/spotify';
import * as _ from 'underscore';
import { asAsync } from '../../utils';
import { TrackData } from './trackData';
import { utils } from 'databindjs';
import { MyLibraryData } from './myLibraryData';


export interface IRecomendation {
    id: string;
    track?: ITrack;
    date?: number;
    index?: number;
    updatedTs: number;
    syncTs: number;
}

class RecommendationsData {
    uow = null;
    tableName = 'recommendations';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err?, result?: IRecomendation, index?: number): void }) {
        const tracks = new TrackData(this.uow);
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, record, index) => {
            queue.push(next => {
                if (_.isUndefined(record)) {
                    callback();
                    return next();
                }
                if (err) {
                    callback(err);
                    return next();
                }
                tracks.getById(record.id, (err, track) => {
                    if (err) {
                        callback(err);
                        return next();
                    }
                    callback(err, {
                        ...record,
                        track: track
                    }, index);
                    next();
                });
            });
        });
	}

    getById(recommendationId: string, callback: { (err?, result?: IRecomendation): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.getById(this.tableName, recommendationId, (err, record, index) => {
            if (err) return callback(err);
            if (_.isUndefined(record)) {
                callback();
                return;
            }
            tracks.getById(record.id, (err, track) => {
                callback(err, {
                    ...record,
                    track: track
                });
            });
        });
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(recommendation: IRecomendation, callback: { (err, result?): void }) {
        const queue = utils.asyncQueue();
        const tracks = new TrackData(this.uow);
        const { track } = recommendation;
        const recommendationId = track.id;
        const trackId = track.id;

        queue.push(next => {
            tracks.refresh(trackId, {
                ...track,
                updatedTs: recommendation.updatedTs,
                syncTs: recommendation.syncTs
            }, (err, result) => {
                if (err) callback(err);
                next();
            });
        });

        queue.push(next => {
            this.uow.create(this.tableName, {
                id: recommendationId,
                ..._.omit(recommendation, 'track')
            }, (err, result) => {
                if (err) callback(err);
                next();
            });
        });

        queue.push(next => {
            callback(null, true);
            next();
        });
	}

	update(recommendationId: string, recommendation: IRecomendation, callback: { (err, result?): void }) {
        const queue = utils.asyncQueue();
        const tracks = new TrackData(this.uow);
        const { track } = recommendation;
        const trackId = track.id;

        queue.push(next => {
            tracks.refresh(trackId, {
                ...track,
                updatedTs: recommendation.updatedTs,
                syncTs: recommendation.syncTs
            }, (err, result) => {
                if (err) callback(err);
                next();
            });
        });

        queue.push(next => {
            this.uow.update(this.tableName, recommendationId, {
                id: recommendationId,
                ..._.omit(recommendation, 'track')
            }, (err, result) => {
                if (err) callback(err);
                next();
            });
        });

        queue.push(next => {
            callback(null, true);
            next();
        });
	}

    delete(recommendationId, callback: { (err?, result?): void }) {
        const tracks = new TrackData(this.uow);
        const myLibrary = new MyLibraryData(this.uow);
        this.uow.getById(this.tableName, recommendationId, (err, record, index) => {
            if (err) return callback(err);
            if (_.isUndefined(record)) {
                callback();
                return;
            }
            tracks.getById(record.id, (err, track) => {
                let exists = false;
                myLibrary.eachByTrack(track.id, (err, result) => {
                    if (_.isUndefined(result)) {
                        exists || tracks.delete(track.id, (err, result) => {

                        });
                        return;
                    }
                    exists = true;
                });
            });
            this.uow.delete(this.tableName, recommendationId, callback);
        });
    }

    refresh(recommendationId: string, recommendation: IRecomendation, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, recommendationId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(recommendationId, {
                    ...record,
                    ...recommendation
                }, callback);
            } else {
                this.create(recommendation, callback);
            }
        });
    }
}

export { RecommendationsData };
