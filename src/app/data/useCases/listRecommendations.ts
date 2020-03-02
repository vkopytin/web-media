import { DataStorage } from '../dataStorage';
import { RecommendationsData } from '../entities/recommendationsData';
import { asAsync } from '../../utils';
import { ITrack } from '../../service/adapter/spotify';
import * as _ from 'underscore';
import { utils } from 'databindjs';


export function listRecommendations(limit = 20) {
    return asAsync<ITrack[]>(null, (cb: { (a, b?): void }) => {
        DataStorage.create((err, connection) => {
            const queue = utils.asyncQueue();
            const subQueue = utils.asyncQueue();
            const recommendations = new RecommendationsData(connection);
            const items = [];
            queue.push(next => {
                recommendations.each((err, result) => {
                    if (err) {
                        cb(err);
                        return next();
                    }
                    if (_.isUndefined(result)) {
                        next();
                        return false;
                    }
                    subQueue.push(next => {
                        items.push(result.track);
                        next();
                    });
                });
            });
            queue.push(next => {
                cb(null, items);
                next();
            });
        });
    });
}
