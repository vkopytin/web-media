import * as _ from 'underscore';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { RecordsStore } from '../entities/recordsStore';
import { TracksStore } from '../entities/tracksStore';
import { PlaylistsStore } from '../entities/playlistsStore';
import { AlbumsStore } from '../entities/albumsStore';
import { ArtistsStore } from '../entities/artistsStore';
import { ImagesStore } from '../entities/imagesStore';
import { PlaylistRowsStore } from '../entities/playlistRowsStore';
import { BannedTracksStore } from '../entities/bannedTracksStore';

export function initializeStructure() {
    return asAsync(() => { }, cb => {
        DataStorage.create((err, storage) => {
            const recordsStore = new RecordsStore(storage);
            const tracksStore = new TracksStore(storage);
            const playlistsStore = new PlaylistsStore(storage);
            const albumsStore = new AlbumsStore(storage);
            const artistsStore = new ArtistsStore(storage);
            const imagesStore = new ImagesStore(storage);
            const playlistRows = new PlaylistRowsStore(storage);
            const bannedTracksStore = new BannedTracksStore(storage);
            storage.initializeStructure(async (err, isInitializing) => {
                try {
                    if (!isInitializing) {

                        return cb(null);
                    }
                    await recordsStore.createTable();
                    await tracksStore.createTable();
                    await playlistsStore.createTable();
                    await albumsStore.createTable();
                    await artistsStore.createTable();
                    await imagesStore.createTable();
                    await playlistRows.createTable();
                    await bannedTracksStore.createTable();
                    cb(null, true);
                } catch (ex) {
                    cb(ex);
                }
            });
        });
    });
}
