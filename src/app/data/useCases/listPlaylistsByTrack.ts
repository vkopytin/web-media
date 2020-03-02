import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import * as _ from 'underscore';
import { utils } from 'databindjs';
import { ITrack } from '../../service/adapter/spotify';
import { MyLibraryData } from '../entities/myLibraryData';
import { IPlaylistData } from '../entities/playlistData';


export function listPlaylistsByTrack(trackId: string, offset = 0, limit = 20) {
    return asAsync<IPlaylistData[]>(null, (cb: { (a, b): void }) => {
        DataStorage.create(async (err, connection) => {
            const myLibrary = new MyLibraryData(connection);
            const queue = utils.asyncQueue();
            const subQueue = utils.asyncQueue(30);
            const items = [] as IPlaylistData[];
            queue.push(next => {
                myLibrary.each((err, result) => {
                    if (_.isUndefined(result)) {
                        next();
                        return false;
                    }
                    if (result.trackId === trackId && result.playlistId) {
                        subQueue.push(next => {
                            items.push(result.playlist);
                            next();
                        });
                        return;
                    }
                });
            });
            queue.push(next => {
                cb(null, items);
                next();
            });
        });
    });
}
