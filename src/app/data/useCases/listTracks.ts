import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import * as _ from 'underscore';
import { utils } from 'databindjs';
import { ITrack } from '../../service/adapter/spotify';
import { MyLibraryData } from '../entities/myLibraryData';


export function listTracks(offset = 0, limit = 20) {
    return asAsync<ITrack[]>(null, (cb: { (a, b): void }) => {
        DataStorage.create(async (err, connection) => {
            const myLibrary = new MyLibraryData(connection);
            const queue = utils.asyncQueue();
            const subQueue = utils.asyncQueue(30);
            const items = [] as ITrack[];
            let index = 0;
            queue.push(next => {
                myLibrary.each((err, result) => {
                    if (_.isUndefined(result)) {
                        next();
                        return false;
                    }
                    if (result.playlistId) {
                        return;
                    }
                    if (result.position < offset) {
                        return;
                    }
                    if (result.position >= offset + limit) {
                        return;
                    }
                    index++;
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
