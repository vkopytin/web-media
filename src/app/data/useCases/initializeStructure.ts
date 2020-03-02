import { asAsync } from '../../utils';
import { DataStorage } from '../dataStorage';
import { utils } from 'databindjs';
import { MyLibraryData } from '../entities/myLibraryData';
import * as _ from 'underscore';
import { ImageData } from '../entities/imageData';
import { AlbumData } from '../entities/albumData';
import { AlbumToImagesData } from '../entities/albumToImagesData';
import { ArtistData } from '../entities/artistData';
import { ArtistsToAlbumsData } from '../entities/artistsToAlbumsData';
import { ArtistsToTracksData } from '../entities/artistsToTracksData';
import { DeviceData } from '../entities/deviceData';
import { PlaylistData } from '../entities/playlistData';
import { PlaylistToImagesData } from '../entities/playlistToImagesData';
import { RecommendationsData } from '../entities/recommendationsData';
import { TrackData } from '../entities/trackData';
import { TracksPlaylistsData } from '../entities/tracksToPlaylistsData';


export function initializeStructure() {
    return asAsync<boolean>(null, (cb: { (a, b): void }) => {
        DataStorage.create(async (err, storage) => {
            storage.initializeStructure(async (err, result) => {
                if (_.isUndefined(result)) return cb(null, false);
                const albums = new AlbumData(storage);
                const albumsToImages = new AlbumToImagesData(storage);
                const artists = new ArtistData(storage);
                const artistsToAlbums = new ArtistsToAlbumsData(storage);
                const artistsToTracks = new ArtistsToTracksData(storage);
                const devices = new DeviceData(storage);
                const images = new ImageData(storage);
                const myLibrary = new MyLibraryData(storage);
                const playlists = new PlaylistData(storage);
                const playlistsToImages = new PlaylistToImagesData(storage);
                const recomendations = new RecommendationsData(storage);
                const tracks = new TrackData(storage);
                const tracksToPlaylists = new TracksPlaylistsData(storage);

                await asAsync(albums, albums.createTable);
                await asAsync(albumsToImages, albumsToImages.createTable);
                await asAsync(artists, artists.createTable);
                await asAsync(artistsToAlbums, artistsToAlbums.createTable);
                await asAsync(artistsToTracks, artistsToTracks.createTable);
                await asAsync(devices, devices.createTable);
                await asAsync(myLibrary, myLibrary.createTable);
                await asAsync(images, images.createTable);
                await asAsync(playlists, playlists.createTable);
                await asAsync(playlistsToImages, playlistsToImages.createTable);
                await asAsync(recomendations, recomendations.createTable);
                await asAsync(tracks, tracks.createTable);
                await asAsync(tracksToPlaylists, tracksToPlaylists.createTable);

                cb(null, true);
            });
        });
    });
}