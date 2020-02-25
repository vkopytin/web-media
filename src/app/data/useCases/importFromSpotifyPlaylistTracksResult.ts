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


export async function importFromSpotifyPlaylistTracksResult(playlistId: string, result: IResponseResult<ISpotifySong>, offset: number) {
    return await DataStorage.create(async (connection) => {
        const tracks = new TrackData(connection);
        const albums = new AlbumData(connection);
        const artists = new ArtistData(connection);
        const images = new ImageData(connection);
        const albumToImages = new AlbumToImagesData(connection);
        const artistsToAlbums = new ArtistsToAlbumsData(connection);
        const artistsToTracks = new ArtistsToTracksData(connection);
        const myLibrary = new MyLibraryData(connection);

        _.each(result.items, async (item, index) => {
            const trackId = item.track.id;
            const albumId = item.track.album.id;

            _.forEach(item.track.album.images, async (image) => {
                const imageUrl = image.url;
                await asAsync(images, images.refresh, imageUrl, {
                    ...image
                });
                await asAsync(albumToImages, albumToImages.refresh, imageUrl, albumId);
            });

            _.forEach(item.track.album.artists, async (artist) => {
                const artistId = artist.id;
                await asAsync(artists, artists.refresh, artist.id, {
                    ...artist
                });
                await asAsync(artistsToAlbums, artistsToAlbums.refresh, artistId, albumId);
            });

            _.forEach(item.track.artists, async (artist) => {
                const artistId = artist.id;
                await asAsync(artists, artists.refresh, artist.id, {
                    ...artist
                });
                await asAsync(artistsToTracks, artistsToTracks.refresh, artistId, trackId);
            });

            await asAsync(albums, albums.refresh, albumId, {
                ..._.omit(item.track.album, 'artists', 'images')
            });

            await asAsync(tracks, tracks.refresh, trackId, {
                ..._.omit(item.track, 'artists', 'album'),
                albumId: albumId
            });

            await asAsync(myLibrary, myLibrary.refresh, `playlist:${playlistId}`, {
                playlistId,
                trackId: trackId,
                position: offset + index
            });

            connection.complete();

            return true;
        });
    });
}
