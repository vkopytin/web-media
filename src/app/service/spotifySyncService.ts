import { ISpotifySong, IUserPlaylist } from '../adapter/spotify';
import { Events } from '../events';
import { Result } from '../utils/result';
import { DataService } from './dataService';
import { SpotifyService } from './spotify';


class SpotifySyncService extends Events {
    limit = 49;

    constructor(public spotify: SpotifyService, private data: DataService) {
        super();
    }

    async syncData(): Promise<Result<Error, boolean>> {
        try {
            // toDO: enable sync
            return Result.of(true);
            await this.syncMyTracks();
            const playlistsResult = await this.syncMyPlaylists();
            return await playlistsResult.cata(async playlists => {
                for (const playlist of playlists) {
                    await this.syncTracksByPlaylist(playlist);
                }
                this.cleanUpData();

                return Result.of(true);
            });
        } catch (ex) {
            return Result.error(ex as Error);
        }
    }

    async syncMyPlaylists(): Promise<Result<Error, IUserPlaylist[]>> {
        try {
            let res = [] as IUserPlaylist[];
            for await (const playlists of this.listMyPlaylists()) {
                for (const playlist of playlists) {
                    await this.data.createPlaylist(playlist);
                }
                res = [...res, ...playlists];
            }
            return Result.of(res);
        } catch (ex) {
            return Result.error(ex as Error);
        }
    }

    async syncTracksByPlaylist(playlist: IUserPlaylist): Promise<void> {
        let index = 0;
        for await (const songs of this.listPlaylistTracks(playlist.id)) {
            for (const song of songs) {
                await this.data.createTrack(song.track);
                await this.data.addTrackToPlaylist(playlist, song, index++);
            }
        }
    }

    async syncMyTracks(): Promise<void> {
        let index = 0;
        const myPlaylist: IUserPlaylist = {
            id: 'myTracks',
            name: 'my Tracks',
            description: '',
            images: [],
            uri: 'my:playlist:myTracks',
            owner: {},
            snapshot_id: '0',
            tracks: {
                total: 0
            }
        };
        await this.data.createPlaylist(myPlaylist);
        for await (const songs of this.listMyTracks()) {
            for (const song of songs) {
                await this.data.createTrack(song.track);
                await this.data.addTrackToPlaylist(myPlaylist, song, index++);
            }
        }
    }

    async * listPlaylistTracks(playlistId: string) {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currentOffset = offset;
            const result = await this.spotify.fetchPlaylistTracks(playlistId, offset, this.limit + 1);

            const response = result.match(s => s, e => { throw e });

            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield response.items.map((item: ISpotifySong, index: number): ISpotifySong => ({
                position: currentOffset + index,
                ...item
            }));
        }
    }

    async * listMyPlaylists() {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currOffset = offset;
            const result = await this.spotify.fetchMyPlaylists(offset, this.limit + 1);

            const response = result.match(s => s, e => { throw e });
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield response.items.map((item: IUserPlaylist, index: number): IUserPlaylist & { index?: number } => ({
                index: currOffset + index as number | undefined,
                ...item
            }));
        }
    }

    async * listMyTracks() {
        let total = this.limit;
        let offset = 0;
        while (offset < total) {
            const currentOffset = offset,
                result = await this.spotify.fetchTracks(offset, this.limit + 1);

            const response = result.match(s => s, e => { throw e });
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield response.items.map((item: ISpotifySong, index: number): ISpotifySong => ({
                position: currentOffset + index,
                ...item
            }));
        }
    }

    async cleanUpData(): Promise<boolean> {
        return true;
    }
}

export { SpotifySyncService };
