/* eslint-disable */

import { SpotifyMediaAdapter } from '../../adapter';
import { IMediaPort, IUserPlaylist, IUserPlaylistsResult } from '../../ports/iMediaProt';
import { DataSyncService } from '../dataSyncService';
import { PlaylistsService } from '../playlistsService';

jest.mock('../../adapter');
jest.mock('../dataSyncService');

describe('Playlists Service', () => {
    let media: IMediaPort;
    let playlists: PlaylistsService;
    let dataSync: DataSyncService;

    beforeEach(() => {
        media = new SpotifyMediaAdapter('test');
        dataSync = new DataSyncService({} as any, {} as any);
        playlists = new PlaylistsService(media, dataSync);
    });

    it('should list playlists', async () => {
        jest.spyOn(media, 'myPlaylists').mockImplementation((o, l) => Promise.resolve(makePlaylistsResult(o, l, 15)));

        await playlists.listPlaylists();

        expect(playlists.playlists.length).toEqual(15);
        expect(playlists.offset).toEqual(15);
    });

    it('should load more playlists', async () => {
        playlists.limit = 5;
        jest.spyOn(media, 'myPlaylists').mockImplementation((o, l) => Promise.resolve(makePlaylistsResult(o, l, 12)));

        await playlists.listPlaylists();

        expect(playlists.playlists.length).toEqual(5);
        expect(playlists.offset).toEqual(5);

        await playlists.loadMorePlaylists();

        expect(playlists.playlists.length).toEqual(10);
        expect(playlists.offset).toEqual(10);

        await playlists.loadMorePlaylists();

        expect(playlists.playlists.length).toEqual(12);
        expect(playlists.offset).toEqual(12);
    });
});

function makePlaylistsResult(offset = 0, limit = 20, total = 45): IUserPlaylistsResult {
    const res: IUserPlaylist[] = [];
    for (let i = offset; i < Math.min(offset + limit, total); i++) {
        res.push(makePlaylistItem(('000' + i).substring(2)))
    }

    return {
        href: '',
        items: res,
        limit,
        next: '',
        offset,
        previous: '',
        total,
    };
}

function makePlaylistItem(id = '01'): IUserPlaylist {
    return {
        id: 'id-' + id,
        description: ['descriptio', id].join(' '),
        images: [],
        name: ['playlist name', id].join(' '),
        owner: {},
        snapshot_id: ['snapshot', id].join(' '),
        tracks: {
            total: 0
        },
        uri: ['playlist:uri', id].join(':'),
    };
}
