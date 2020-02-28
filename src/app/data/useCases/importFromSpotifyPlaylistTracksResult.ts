import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../../service/adapter/spotify';
import { TrackData } from '../entities/trackData';
import { DataStorage } from '../dataStorage';
import { AlbumData } from '../entities/albumData';
import { ArtistData } from '../entities/artistData';
import { ImageData } from '../entities/imageData';
import { AlbumToImagesData } from '../entities/albumToImagesData';
import { asAsync } from '../../utils';
import { ArtistsToAlbumsData } from '../entities/artistsToAlbumsData';
import { ArtistsToTracksData } from '../entities/artistsToTracksData';
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
