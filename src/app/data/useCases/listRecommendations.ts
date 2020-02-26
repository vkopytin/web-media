import { DataStorage } from '../dataStorage';
import { RecommendationsData } from '../entities/recommendationsData';
import { asAsync } from '../../utils';
import { ITrack } from '../../service/adapter/spotify';
import * as _ from 'underscore';


export function listRecommendations(limit = 20) {
    const tasks = [] as ITrack[];

    DataStorage.create((err, connection) => {
        const recommendations = new RecommendationsData(connection);

        recommendations.each((err, result) => {
            if (_.isUndefined(result)) {
                return true;
            }
            tasks.push(result.track);
        })
    });

    return Promise.all(tasks);
}
