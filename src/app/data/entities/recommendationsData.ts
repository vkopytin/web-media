import { IRecommendationsResult, ITrack } from '../../service/adapter/spotify';
import * as _ from 'underscore';
import { asAsync } from '../../utils';
import { TrackData } from './trackData';

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
        this.uow.createTable(this.tableName, () => { });
	}

    each(callback: { (err?, result?: IRecomendation, index?: number): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.each(this.tableName, (err, record, index) => {
            if (_.isUndefined(record)) return callback();
            if (err) {
                return callback(err);
            }
            tracks.getById(record.id, (err, track) => {
                if (err) {
                    return callback(err);
                }
                callback(err, {
                    ...record,
                    track: track
                }, index);
            });
        });
	}

    getById(recommendationId: string, callback: { (err, result?: IRecomendation): void }) {
        const tracks = new TrackData(this.uow);
        this.uow.getById(this.tableName, recommendationId, (err, record, index) => {
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
        const tasks = []
        const tracks = new TrackData(this.uow);
        const { track } = recommendation;
        const recommendationId = track.id;
        const trackId = track.id;

        tasks.push(asAsync(tracks, tracks.refresh, trackId, track));
        tasks.push(asAsync(this.uow, this.uow.create, this.tableName, {
            id: recommendationId,
            ..._.omit(recommendation, 'track')
        }));

        Promise.all(tasks).then(() => callback(null, true));
	}

	update(recommendationId: string, recommendation: IRecomendation, callback: { (err, result?): void }) {
        const tasks = []
        const tracks = new TrackData(this.uow);
        const { track } = recommendation;
        const trackId = track.id;

        tasks.push(asAsync(tracks, tracks.refresh, trackId, track));
        tasks.push(asAsync(this.uow, this.uow.create, this.tableName, {
            id: recommendationId,
            ..._.omit(recommendation, 'track')
        }));

        Promise.all(tasks).then(() => callback(null, true));
	}

	delete(recommendationId, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, recommendationId, callback);
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
