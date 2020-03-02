import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../../service/adapter/spotify';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { MyLibraryData } from '../entities/myLibraryData';
import { utils } from 'databindjs';


export function importFromSpotifyTracksResult(result: IResponseResult<ISpotifySong>, offset: number) {
    return asAsync<Boolean>(null, (cb: { (a, b?): void }) => {
        DataStorage.create((err, connection) => {
            const queue = utils.asyncQueue(10);
            const myLibrary = new MyLibraryData(connection);
            const syncTs = +new Date();

            _.each(result.items, (item, index) => {
                const trackId = item.track.id;
                queue.push(next => {
                    myLibrary.refresh(`track:${trackId}`, {
                        track: item.track,
                        isLiked: true,
                        position: offset + index,
                        updatedTs: syncTs,
                        syncTs
                    }, (err, result) => {
                        if (err) {
                            cb(err);
                        }
                        next();
                    });
                });

                connection.complete();
            });
            queue.push(next => {
                cb(null, true);
            });
        });
    });
}
