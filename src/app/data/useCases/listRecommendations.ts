import { DataStorage } from '../dataStorage';
import { RecommendationsData } from '../entities/recommendationsData';
import { asAsync } from '../../utils';


export function listRecommendations(limit = 20) {
    const tasks = [];

    DataStorage.create((err, connection) => {
        const recommendations = new RecommendationsData(connection);
        let maxDate = 0;

        recommendations.each((err, result) => {
            if (err) {
                tasks.push(Promise.reject(err));
            }
            maxDate = Math.max(maxDate, result.date);
        });

        recommendations.each((err, result) => {
            if (err) {
                tasks.push(Promise.reject(err));
            }
            if (result.date >= maxDate) {
                tasks.push(result);
            }
        })
    });

    return Promise.all(tasks);
}
