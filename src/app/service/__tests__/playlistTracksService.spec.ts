import { SpotifyMediaAdapter } from '../../adapter';
import { IMediaPort, IResponseResult, ISpotifySong } from '../../ports/iMediaProt';
import { Result } from '../../utils/result';
import { TrackViewModelItem } from '../../viewModels/trackViewModelItem';
import { PlaylistTracksService } from '../playlistTracksService';

jest.mock('../../viewModels/trackViewModelItem');
jest.mock('../../utils/inject', () => {
    return {
        inject: jest.fn().mockImplementation(() => ({})),
    };
});

describe('Playlist Tracks Service', () => {
    let playlistTracksService: PlaylistTracksService;
    let media: IMediaPort;

    beforeEach(() => {
        media = new SpotifyMediaAdapter('test');
        playlistTracksService = new PlaylistTracksService(media)
    });

    it('should list tracks', async () => {
        jest.spyOn(TrackViewModelItem.prototype, 'fetchData').mockImplementation(() => Promise.resolve());
        jest.spyOn(media, 'listPlaylistTracks').mockImplementation((id, o, l) => Promise.resolve(makePlaylistTracksResult(o, l, 15)));
        jest.spyOn(media, 'hasTracks').mockImplementation(() => Promise.resolve([]));

        playlistTracksService.currentPlaylistId = 'playlist-id-123';
        await playlistTracksService.listPlaylistTracks();

        expect(playlistTracksService.tracks.length).toEqual(15);
        expect(playlistTracksService.offset).toEqual(15);
    });

    it('should list tracks by playlist id', async () => {
        jest.spyOn(TrackViewModelItem.prototype, 'fetchData').mockImplementation(() => Promise.resolve());
        jest.spyOn(media, 'listPlaylistTracks').mockImplementation((id, o, l) => Promise.resolve(makePlaylistTracksResult(o, l, 15)));
        jest.spyOn(media, 'hasTracks').mockImplementation(() => Promise.resolve([]));

        const playlistId = 'playlist-id-123';
        await playlistTracksService.listPlaylistTracksByPlaylistId(playlistId);

        expect(playlistTracksService.currentPlaylistId).toEqual(playlistId);
        expect(playlistTracksService.tracks.length).toEqual(15);
        expect(playlistTracksService.offset).toEqual(15);
    });

    it('should load more playlists', async () => {
        playlistTracksService.limit = 5;
        jest.spyOn(media, 'listPlaylistTracks').mockImplementation((id, o, l) => Promise.resolve(makePlaylistTracksResult(o, l, 12)));
        jest.spyOn(media, 'hasTracks').mockImplementation(() => Promise.resolve([]));

        await playlistTracksService.listPlaylistTracksByPlaylistId('playlist-id-123');

        expect(playlistTracksService.tracks.length).toEqual(5);
        expect(playlistTracksService.offset).toEqual(5);

        await playlistTracksService.loadMoreTracks();

        expect(playlistTracksService.tracks.length).toEqual(10);
        expect(playlistTracksService.offset).toEqual(10);

        await playlistTracksService.loadMoreTracks();

        expect(playlistTracksService.tracks.length).toEqual(12);
        expect(playlistTracksService.offset).toEqual(12);
    });

    it('should like track', async () => {
        const trackItem = new TrackViewModelItem({} as any, 0);
        jest.spyOn(trackItem, 'id').mockImplementation(() => 'track-id-123');
        jest.spyOn(trackItem, 'likeTrack').mockImplementation(() => Promise.resolve(Result.of({} as any)));
        jest.spyOn(media, 'hasTracks').mockImplementation(() => Promise.resolve([]));

        await playlistTracksService.likeTrack(trackItem);

        expect(trackItem.likeTrack).toHaveBeenCalledWith();
        expect(media.hasTracks).toHaveBeenCalledWith(['track-id-123']);
    });

    it('should unlike track', async () => {
        const trackItem = new TrackViewModelItem({} as any, 0);
        jest.spyOn(trackItem, 'id').mockImplementation(() => 'track-id-123');
        jest.spyOn(trackItem, 'unlikeTrack').mockImplementation(() => Promise.resolve(Result.of({} as any)));
        jest.spyOn(media, 'hasTracks').mockImplementation(() => Promise.resolve([]));

        await playlistTracksService.unlikeTrack(trackItem);

        expect(trackItem.unlikeTrack).toHaveBeenCalledWith();
        expect(media.hasTracks).toHaveBeenCalledWith(['track-id-123']);
    });

    it('should reorder tracks forvard', async () => {
        playlistTracksService.currentPlaylistId = 'playlist-id-123';
        const tracks = [{}, {}, {}, {}, {}].map((t, i) => new TrackViewModelItem(t as any, i));
        playlistTracksService.tracks = tracks;
        jest.spyOn(tracks[1], 'id').mockImplementation(() => 'id-123');
        jest.spyOn(tracks[4], 'id').mockImplementation(() => '456');
        jest.spyOn(media, 'reorderTracks').mockImplementation(() => Promise.resolve({ snapshot_id: 'snapshot-id-123' }));

        await playlistTracksService.reorderTrack(playlistTracksService.tracks[1], playlistTracksService.tracks[4]);

        expect(media.reorderTracks).toHaveBeenCalledWith('playlist-id-123', 1, 5);
        expect(playlistTracksService.tracks).toEqual([
            tracks[0],
            tracks[2],
            tracks[3],
            tracks[4],
            tracks[1],
        ]);
    });

    it('should reorder tracks backwards', async () => {
        playlistTracksService.currentPlaylistId = 'playlist-id-123';
        const tracks = [{}, {}, {}, {}, {}].map((t, i) => new TrackViewModelItem(t as any, i));
        playlistTracksService.tracks = tracks;
        jest.spyOn(tracks[1], 'id').mockImplementation(() => 'id-123');
        jest.spyOn(tracks[4], 'id').mockImplementation(() => '456');
        jest.spyOn(media, 'reorderTracks').mockImplementation(() => Promise.resolve({ snapshot_id: 'snapshot-id-123' }));

        await playlistTracksService.reorderTrack(playlistTracksService.tracks[4], playlistTracksService.tracks[1]);

        expect(media.reorderTracks).toHaveBeenCalledWith('playlist-id-123', 4, 1);
        expect(playlistTracksService.tracks).toEqual([
            tracks[0],
            tracks[4],
            tracks[1],
            tracks[2],
            tracks[3],
        ]);
    });

});

function makePlaylistTracksResult(offset = 0, limit = 20, total = 45): IResponseResult<ISpotifySong> {
    const res: ISpotifySong[] = [];
    for (let i = offset; i < Math.min(offset + limit, total); i++) {
        res.push(makePlaylistRowItem(('000' + i).substring(2)))
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

function makePlaylistRowItem(id = '01'): ISpotifySong {
    return {
        track: {
            id: 'id-' + id,
            name: ['playlist name', id].join(' '),
            uri: ['playlist:uri', id].join(':'),
            duration_ms: 123,
            track_number: +id,
            album: {
                album_type: 'test',
                artists: [],
                external_urls: { spotify: ['http://album.com/url', id].join(':') },
                id: ['album-id', id].join('-'),
                images: [],
                name: ['album name', id].join(' '),
                release_date: new Date().toISOString(),
                total_tracks: 10,
                uri: 'album:uri'
            },
            artists: []
        },
        added_at: new Date().toISOString(),
        played_at: new Date().toDateString(),
        position: 0,
    };
}
