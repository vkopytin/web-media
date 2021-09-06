import { withEvents } from 'databindjs';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import * as _ from 'underscore';
import { DataServiceResult } from './results/dataServiceResult';
import { initializeStructure } from '../data/useCases';
import { ITrack } from '../data/entities/interfaces/iTrack';
import { DataStorage } from '../data/dataStorage';
import { TracksStore } from '../data/entities/tracksStore';
import { ISpotifySong, IUserPlaylist } from '../adapter/spotify';
import { PlaylistsStore } from '../data/entities/playlistsStore';
import { ImagesStore } from '../data/entities/imagesStore';
import { AlbumsStore } from '../data/entities/albumsStore';
import { ArtistsStore } from '../data/entities/artistsStore';
import { PlaylistRowsStore } from '../data/entities/playlistRowsStore';
import { BannedTracksStore } from '../data/entities/bannedTracksStore';
import { ServiceResult } from '../base/serviceResult';


class DataService extends withEvents(BaseService) {
    static async create(connection: Service) {
        await initializeStructure();
        return DataServiceResult.success(new DataService(connection));
    }

    constructor(public ss: Service) {
        super();
    }

    async createTrack(track: ITrack) {
        return new Promise<any>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const tracksStore = new TracksStore(storage);
                    const albumsStore = new AlbumsStore(storage);
                    const artistsStore = new ArtistsStore(storage);
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

    async createPlaylist(playlist: IUserPlaylist) {
        return new Promise<any>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistsStore = new PlaylistsStore(storage);
                    const imagesStore = new ImagesStore(storage);
                    const res = await playlistsStore.refresh(playlist);
                    await Promise.all(playlist.images.map(image => imagesStore.refresh(image)));

                    resolve(res);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async addTrackToPlaylist(playlist: IUserPlaylist, song: ISpotifySong, index = 0) {
        return new Promise<any>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistRowsStore = new PlaylistRowsStore(storage);
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

    async removeTrackFromPlaylist(playlistId: string, song: ISpotifySong) {
        return new Promise<any>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const playlistRowsStore = new PlaylistRowsStore(storage);
                    const rows = playlistRowsStore.where({
                        playlistId,
                        trackId: song.track.id
                    });
                    for await (const row of rows) {
                        await playlistRowsStore.delete(row.id);
                    }
                    resolve(true);
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    async listPlaylistsByTrack(track: ITrack) {
        return new Promise<ServiceResult<IUserPlaylist[], Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(DataServiceResult.error(err));
                }

                try {
                    const res = [] as IUserPlaylist[];
                    const playlistRowsStore = new PlaylistRowsStore(storage);
                    for await (const row of playlistRowsStore.where({ trackId: track.id })) {
                        res.push(row.playlist);
                    }

                    resolve(DataServiceResult.success(res));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    async bannTrack(trackId: string) {
        return new Promise<DataServiceResult<boolean, Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const bannedTracksStore = new BannedTracksStore(storage);
                    await bannedTracksStore.refresh({ id: trackId } as ITrack);

                    resolve(DataServiceResult.success(true));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    async removeBannFromTrack(trackId: string) {
        return new Promise<DataServiceResult<boolean, Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(DataServiceResult.error(err));
                }

                try {
                    const bannedTracksStore = new BannedTracksStore(storage);
                    await bannedTracksStore.delete(trackId);

                    resolve(DataServiceResult.success(true));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    async isBannedTrack(trackId: string) {
        return new Promise<DataServiceResult<boolean, Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(DataServiceResult.error(err));
                }

                try {
                    const bannedTracksStore = new BannedTracksStore(storage);
                    const track = await bannedTracksStore.get(trackId);

                    resolve(DataServiceResult.success(!!track));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }

    async listBannedTracks(trackIds: string[]) {
        trackIds = [].concat(trackIds).sort();
        return new Promise<DataServiceResult<string[], Error>>((resolve, reject) => {
            DataStorage.create(async (err, storage) => {
                if (err) {
                    return reject(DataServiceResult.error(err));
                }

                try {
                    const bannedIds = [] as string[];
                    const bannedTracksStore = new BannedTracksStore(storage);
                    for await (const track of bannedTracksStore.list()) {
                        if (trackIds.indexOf(track.id) !== -1) {
                            bannedIds.push(track.id);
                        }
                    }

                    resolve(DataServiceResult.success(bannedIds));
                } catch (ex) {
                    reject(DataServiceResult.error(ex));
                }
            });
        });
    }
}

export { DataService };
