import { DataStorage } from '../data/dataStorage';
import { AlbumsStore } from '../data/entities/albumsStore';
import { ArtistsStore } from '../data/entities/artistsStore';
import { BannedTracksStore } from '../data/entities/bannedTracksStore';
import { ImagesStore } from '../data/entities/imagesStore';
import { IPlaylistRow } from '../data/entities/interfaces/iPlaylistRow';
import { ITrack } from '../data/entities/interfaces/iTrack';
import { PlaylistRowsStore } from '../data/entities/playlistRowsStore';
import { PlaylistsStore } from '../data/entities/playlistsStore';
import { TracksStore } from '../data/entities/tracksStore';
import { initializeStructure } from '../data/useCases';
import { Events } from '../events';
import { ISpotifySong, IUserPlaylist } from '../ports/iMediaProt';
import { Result } from '../utils/result';


class DataService extends Events {
    constructor() {
        super();
    }

    async init() {
        await initializeStructure();
    }

    async createTrack(track: ITrack): Promise<unknown> {
        return new Promise((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const tracksStore = new TracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const albumsStore = new AlbumsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const artistsStore = new ArtistsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const res = await tracksStore.refresh(track);

                    await albumsStore.refresh(track.album);
                    await Promise.all(track.artists.map(artist => artistsStore.refresh(artist)));

                    resolve(res);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async getPlaylistById(playlistId: string): Promise<IUserPlaylist | null> {
        return new Promise((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistsStore = new PlaylistsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const res = await playlistsStore.get(playlistId);

                    resolve(res as IUserPlaylist | null);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async createPlaylist(playlist: IUserPlaylist): Promise<unknown> {
        return new Promise((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistsStore = new PlaylistsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const imagesStore = new ImagesStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const res = await playlistsStore.refresh(playlist);
                    await Promise.all(playlist.images.map(image => imagesStore.refresh(image)));

                    resolve(res);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async addTrackToPlaylist(playlist: IUserPlaylist, song: ISpotifySong, index = 0): Promise<boolean> {
        return new Promise((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistRowsStore = new PlaylistRowsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const indexStr = '0000000000000000' + index;
                    const id = `${indexStr.substr(-8)}:${playlist.id}`;
                    playlistRowsStore.refresh({
                        id,
                        playlist,
                        playlistId: playlist.id,
                        trackId: song.track.id,
                        ...song,
                    });

                    resolve(true);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async removeTrackFromPlaylist(playlistId: string, song: ISpotifySong): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistRowsStore = new PlaylistRowsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const rows = playlistRowsStore.where({
                        playlistId,
                        trackId: song.track.id
                    });
                    for await (const row of rows) {
                        await playlistRowsStore.delete((row as IPlaylistRow).id);
                    }
                    resolve(true);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async listPlaylistsByTrack(track: ITrack): Promise<Result<Error, IUserPlaylist[]>> {
        return new Promise<Result<Error, IUserPlaylist[]>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(Result.error(err));
                }

                try {
                    const res = [] as IUserPlaylist[];
                    const playlistRowsStore = new PlaylistRowsStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    for await (const row of playlistRowsStore.where({ trackId: track.id })) {
                        res.push((row as IPlaylistRow).playlist as IUserPlaylist);
                    }

                    resolve(Result.of(res));
                } catch (ex) {
                    reject(Result.error(ex as Error));
                }
            });
        });
    }

    async bannTrack(trackId: string): Promise<Result<Error, boolean>> {
        return new Promise<Result<Error, boolean>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const bannedTracksStore = new BannedTracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    await bannedTracksStore.refresh({ id: trackId } as ITrack);

                    resolve(Result.of(true));
                } catch (ex) {
                    reject(Result.error(ex as Error));
                }
            });
        });
    }

    async removeBannFromTrack(trackId: string): Promise<Result<Error, boolean>> {
        return new Promise<Result<Error, boolean>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(Result.error(err));
                }

                try {
                    const bannedTracksStore = new BannedTracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const res = await bannedTracksStore.delete(trackId);

                    resolve(Result.of(res));
                } catch (ex) {
                    reject(Result.error(ex as Error));
                }
            });
        });
    }

    async isBannedTrack(trackId: string): Promise<Result<Error, boolean>> {
        return new Promise<Result<Error, boolean>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(Result.error(err));
                }

                try {
                    const bannedTracksStore = new BannedTracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    const track = await bannedTracksStore.get(trackId);

                    resolve(Result.of(!!track));
                } catch (ex) {
                    reject(Result.error(ex as Error));
                }
            });
        });
    }

    async listBannedTracks(trackIds: string[]): Promise<Result<Error, string[]>> {
        trackIds = ([] as string[]).concat(trackIds).sort();
        return new Promise<Result<Error, string[]>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(Result.error(err));
                }

                try {
                    const bannedIds = [] as string[];
                    const bannedTracksStore = new BannedTracksStore(storage!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    for await (const track of bannedTracksStore.list()) {
                        if (trackIds.indexOf(track.id) !== -1) {
                            bannedIds.push(track.id);
                        }
                    }

                    resolve(Result.of(bannedIds));
                } catch (ex) {
                    reject(Result.error(ex as Error));
                }
            });
        });
    }
}

export { DataService };
