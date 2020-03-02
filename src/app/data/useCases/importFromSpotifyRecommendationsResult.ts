import * as _ from 'underscore';
import { IRecommendationsResult } from '../../service/adapter/spotify';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { RecommendationsData, IRecomendation } from '../entities/recommendationsData';
import { utils } from 'databindjs';


export async function importFromSpotifyRecommendationsResult(result: IRecommendationsResult, timestamp: number) {
    return asAsync<IRecomendation>(null, (cb: { (a, b?): void }) => {
        DataStorage.create(async (err, connection) => {
            const queue = utils.asyncQueue();
            const recommendations = new RecommendationsData(connection);
            const syncTs = +new Date();
            recommendations.each((err, record) => {
                queue.push(next => {
                    if (_.isUndefined(record)) {
                        next();
                        return;
                    }
                    if (record.date < (+new Date() - 1000 * 5)) {
                        recommendations.delete(record.id, (err, result) => {
                            if (err) {
                                cb(err);
                            }
                            next();
                        });
                    } else {
                        next();
                    }
                });
            });

            _.each(result.tracks, (track, index) => {
                queue.push(next => {
                    const trackId = track.id;
                    recommendations.refresh(trackId, {
                        id: trackId,
                        track: track,
                        date: timestamp,
                        index: index,
                        updatedTs: syncTs,
                        syncTs: syncTs
                    }, (err, result) => {
                        if (err) {
                            cb(err);
                        }
                        next();
                    });
                });
            });

            queue.push(next => {
                cb(null, true);
                next();
            });

            connection.complete();
        });
    });
}
