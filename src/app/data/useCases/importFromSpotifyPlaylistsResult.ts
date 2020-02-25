import * as _ from 'underscore';
import { IUserPlaylistsResult } from '../../service/adapter/spotify';
import { DataStorage } from '../dataStorage';
import { PlaylistData } from '../entities/playlistData';
import { asAsync } from '../../utils';
import { ImageData } from '../entities/imageData';
import { PlaylistToImagesData } from '../entities/playlistToImagesData';


export async function importFromSpotifyPlaylistsResult(result: IUserPlaylistsResult, offset: number) {
    return await DataStorage.create(async (connection) => {
        const playlists = new PlaylistData(connection);
        const images = new ImageData(connection);
        const playlistToImages = new PlaylistToImagesData(connection);

        _.each(result.items, async (item, index) => {
            const playlistId = item.id;

            _.forEach(item.images, async (image) => {
                const imageUrl = image.url;
                await asAsync(images, images.refresh, imageUrl, {
                    ...image
                });
                await asAsync(playlistToImages, playlistToImages.refresh, imageUrl, playlistId);
            });

            await asAsync(playlists, playlists.refresh, playlistId, {
                ..._.omit(item, 'images')
            });

            connection.complete();

            return true;
        });
    });
}
