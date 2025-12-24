/* eslint-disable */
import { expect } from "@jest/globals";
import { SpotifyMediaAdapter } from '../../adapter';
import { IMediaPort, IResponseResult, ISpotifySong, ITrack } from '../../ports/iMediaProt';
import { TrackViewModelItem } from '../../viewModels';
import { SuggestionsService } from '../suggestionsService';

jest.mock('../../viewModels/trackViewModelItem');
jest.mock('../../utils/inject', () => {
    return {
        inject: jest.fn().mockImplementation(() => ({})),
    };
});

describe('Suggestions service', () => {
    let media: IMediaPort;
    let suggestions: SuggestionsService;

    beforeEach(() => {
        media = new SpotifyMediaAdapter('');
        suggestions = new SuggestionsService(media);
    });

    it('should fetch suggestions from my tracks', async () => {
        const returnTrack = makePlaylistRowItem('22').track;
        jest.spyOn(media, 'tracks').mockImplementation((o, l) => Promise.resolve(makePlaylistTracksResult(o, l)));
        jest.spyOn(media, 'search').mockImplementation(() => Promise.resolve({
            tracks: { items: [returnTrack] } as IResponseResult<ITrack>,
        }));
        jest.spyOn(media, 'hasTracks').mockImplementation(() => Promise.resolve([true]));
        jest.spyOn(TrackViewModelItem, 'fromTrack').mockImplementation(() => ({ id: jest.fn().mockImplementation(() => 'id-123'), isLiked: false } as any));
        jest.spyOn(TrackViewModelItem.prototype, 'id').mockImplementation(() => 'id-123');

        await suggestions.fetchData();

        expect(media.search).toHaveBeenCalledWith('track', expect.stringContaining('track name 00'));
        expect(media.hasTracks).toHaveBeenCalledWith(['id-123']);
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
            name: ['track name', id].join(' '),
            uri: ['track:uri', id].join(':'),
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
