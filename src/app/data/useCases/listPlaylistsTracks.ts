import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import * as _ from 'underscore';
import { utils } from 'databindjs';
import { ITrack } from '../../service/adapter/spotify';
import { MyLibraryData } from '../entities/myLibraryData';


export function listPlaylistsTracks(playlistId: string, offset = 0, limit = 20) {
    return asAsync<ITrack[]>(null, (cb: { (a, b): void }) => {
        DataStorage.create(async (err, connection) => {
            const myLibrary = new MyLibraryData(connection);
            const queue = utils.asyncQueue();
            const subQueue = utils.asyncQueue(30);
            const items = [] as ITrack[];

            queue.push(next => {
                myLibrary.eachByPlaylist(playlistId, (err, result, index) => {
                    if (_.isUndefined(result)) {
                        next();
                        return true;
                    }
                    if (index < offset) {
                        return;
                    }
                    if (index > offset + limit) {
                        return;
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
