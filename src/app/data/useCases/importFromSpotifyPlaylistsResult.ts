import * as _ from 'underscore';
import { IUserPlaylistsResult } from '../../service/adapter/spotify';
import { DataStorage } from '../dataStorage';
import { PlaylistData } from '../entities/playlistData';
import { asAsync } from '../../utils';
import { ImageData } from '../entities/imageData';
import { PlaylistToImagesData } from '../entities/playlistToImagesData';


export function importFromSpotifyPlaylistsResult(result: IUserPlaylistsResult, offset = 0) {
    const queue = [];
    DataStorage.create((err, connection) => {
        const playlists = new PlaylistData(connection);

        _.each(result.items, (item, index) => {
            const playlistId = item.id;

            queue.push(asAsync(playlists, playlists.refresh, playlistId, {
                index: offset + index,
                ...item
            }));

            connection.complete();
        });
    });

    return Promise.all(queue);
}
