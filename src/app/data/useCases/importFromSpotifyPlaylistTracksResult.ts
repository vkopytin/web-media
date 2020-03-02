import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../../service/adapter/spotify';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { MyLibraryData } from '../entities/myLibraryData';


export function importFromSpotifyPlaylistTracksResult(playlistId: string, result: IResponseResult<ISpotifySong>, offset: number) {
    const queue = [];
    DataStorage.create((err, connection) => {
        const myLibrary = new MyLibraryData(connection);
        const syncTs = +new Date();

        _.each(result.items, (item, index) => {
            const trackId = item.track.id;
            queue.push(asAsync(myLibrary, myLibrary.refresh, `${playlistId}:${trackId}`, {
                playlistId,
                track: item.track,
                position: offset + index,
                updatedTs: syncTs,
                syncTs
            }));

            connection.complete();
        });
    });

    return Promise.all(queue);
}
