import { SpotifyMediaAdapter } from '../../adapter/spotifyMediaAdapter';
import { IUserPlaylist, IUserPlaylistsResult } from '../../ports/iMediaProt';
import { PlaylistsService } from '../playlistsService';

describe('Playlists Service', () => {
    let adapter: SpotifyMediaAdapter;
    let playlistsService: PlaylistsService;

    beforeEach(() => {
        adapter = new SpotifyMediaAdapter('test');
        playlistsService = new PlaylistsService(adapter);
    });

    it('should list playlists', async () => {
        jest.spyOn(adapter, 'myPlaylists').mockImplementation((o, l) => Promise.resolve(makePlaylistsResult(o, l, 15)));

        await playlistsService.listPlaylists();

        expect(playlistsService.playlists.length).toEqual(15);
        expect(playlistsService.offset).toEqual(15);
    });

    it('should load more playlists', async () => {
        playlistsService.limit = 5;
        jest.spyOn(adapter, 'myPlaylists').mockImplementation((o, l) => Promise.resolve(makePlaylistsResult(o, l, 12)));

        await playlistsService.listPlaylists();

        expect(playlistsService.playlists.length).toEqual(5);
        expect(playlistsService.offset).toEqual(5);

        await playlistsService.loadMorePlaylists();

        expect(playlistsService.playlists.length).toEqual(10);
        expect(playlistsService.offset).toEqual(10);

        await playlistsService.loadMorePlaylists();

        expect(playlistsService.playlists.length).toEqual(12);
        expect(playlistsService.offset).toEqual(12);
    });
});

function makePlaylistsResult(offset = 0, limit = 20, total = 45): IUserPlaylistsResult {
    const res: IUserPlaylist[] = [];
    for (let i = offset; i < Math.min(offset + limit, total); i++) {
        res.push(makeTrackItem(('000' + i).substring(-2)))
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

function makeTrackItem(id = '01'): IUserPlaylist {
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
