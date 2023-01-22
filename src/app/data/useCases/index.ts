import { asAsync } from '../../utils';
import { DataStorage } from '../dataStorage';
import { AlbumsStore } from '../entities/albumsStore';
import { ArtistsStore } from '../entities/artistsStore';
import { BannedTracksStore } from '../entities/bannedTracksStore';
import { ImagesStore } from '../entities/imagesStore';
import { PlaylistRowsStore } from '../entities/playlistRowsStore';
import { PlaylistsStore } from '../entities/playlistsStore';
import { RecordsStore } from '../entities/recordsStore';
import { TracksStore } from '../entities/tracksStore';

export function initializeStructure() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return asAsync(() => { }, cb => {
        DataStorage.create((err, storage) => {
            const recordsStore = new RecordsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const tracksStore = new TracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const playlistsStore = new PlaylistsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const albumsStore = new AlbumsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const artistsStore = new ArtistsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const imagesStore = new ImagesStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const playlistRows = new PlaylistRowsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            const bannedTracksStore = new BannedTracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            storage!.initializeStructure(async (err, isInitializing) => { // eslint-disable-line @typescript-eslint/no-non-null-assertion
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
