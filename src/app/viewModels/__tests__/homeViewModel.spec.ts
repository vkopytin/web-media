/* eslint-disable */

import { DataService } from '../../service/dataService';
import { LogService } from '../../service/logService';
import { MediaService } from '../../service/mediaService';
import { PlaybackService } from '../../service/playbackService';
import { SuggestionsService } from '../../service/suggestionsService';
import { Option } from '../../utils/option';
import { Result } from '../../utils/result';
import { HomeViewModel } from '../homeViewModel';
import { TrackViewModelItem } from '../trackViewModelItem';

jest.mock('../../service');
jest.mock('../../service/dataSyncService');
jest.mock('../../service/loginService');
jest.mock('../../service/mediaService');
jest.mock('../../service/playbackService');
jest.mock('../../service/remotePlaybackService');
jest.mock('../trackViewModelItem');
jest.mock('../../utils/inject', () => {
    return {
        inject: jest.fn().mockImplementation(() => { }),
    };
});

describe('Home View Model', () => {
    let homeVm: HomeViewModel;
    let media: MediaService;
    let playback: PlaybackService;
    let data: DataService;
    let logService: LogService;
    let suggestions: SuggestionsService;

    beforeAll(() => {
        data = new DataService();
        media = new MediaService({} as any);
        playback = new PlaybackService({} as any, {} as any);
        logService = new LogService();
        suggestions = new SuggestionsService({} as any);
        homeVm = new HomeViewModel(logService, data, media, playback, {} as any, suggestions);
        homeVm.tracks = [];
    });

    it('Should fetch data', async () => {
        const track = new TrackViewModelItem({} as any, 0);
        jest.spyOn(suggestions, 'fetchData').mockImplementation(() => Promise.resolve());
        jest.spyOn(track, 'id').mockImplementation(() => 'test-id-123');
        jest.spyOn(data, 'listBannedTracks').mockImplementation(() => Promise.resolve(Result.of([])));
        homeVm.tracks = [track];

        await homeVm.fetchData();

        expect(suggestions.fetchData).toHaveBeenCalled();
        expect(data.listBannedTracks).toHaveBeenCalledWith(['test-id-123']);
    });

    it('Should check tracks', async () => {
        const track = new TrackViewModelItem({} as any, 0);
        homeVm.tracks = [track];
        jest.spyOn(track, 'id').mockImplementation(() => 'test-id-123');
        jest.spyOn(data, 'listBannedTracks').mockImplementation(() => Promise.resolve(Result.of([])));

        await homeVm.checkBannedTracks();

        expect(data.listBannedTracks).toHaveBeenCalledWith(['test-id-123']);
    });

    it('Should play track', async () => {
        const track = new TrackViewModelItem({} as any, 0);
        jest.spyOn(track, 'playTracks').mockImplementation(() => Promise.resolve());
        homeVm.tracks = [track];

        await homeVm.playInTracks(track);

        expect(track.playTracks).toHaveBeenCalledWith([track]);
    });

    it('Should resume playback', async () => {
        jest.spyOn(playback, 'resume').mockImplementation(() => Promise.resolve(Option.none()));

        await homeVm.resume();

        expect(playback.resume).toHaveBeenCalledWith();
    });

    it('Should like track', async () => {
        const trackId = 'test-id';
        const track = new TrackViewModelItem({} as any, 0);
        const result = {} as any;
        homeVm.tracks = [track];
        jest.spyOn(track, 'id').mockImplementation(() => trackId);
        jest.spyOn(track, 'likeTrack').mockImplementation(() => Promise.resolve(Result.of(result)));
        jest.spyOn(suggestions, 'checkTracks').mockImplementation(() => Promise.resolve());
        jest.spyOn(data, 'listBannedTracks').mockImplementation(() => Promise.resolve(Result.of([trackId])));

        await homeVm.likeTrack(track);

        expect(track.likeTrack).toHaveBeenCalledWith();
        expect(suggestions.checkTracks).toHaveBeenCalledWith([track]);
        expect(data.listBannedTracks).toHaveBeenCalledWith([trackId]);
    });

    it('Should unlike track', async () => {
        const trackId = 'test-id';
        const track = new TrackViewModelItem({} as any, 0);
        const result = {} as any;
        homeVm.tracks = [track];
        jest.spyOn(track, 'id').mockImplementation(() => trackId);
        jest.spyOn(track, 'unlikeTrack').mockImplementation(() => Promise.resolve(Result.of(result)));
        jest.spyOn(suggestions, 'checkTracks').mockImplementation(() => Promise.resolve());
        jest.spyOn(data, 'listBannedTracks').mockImplementation(() => Promise.resolve(Result.of([trackId])));

        await homeVm.unlikeTrack(track);

        expect(track.unlikeTrack).toHaveBeenCalledWith();
        expect(suggestions.checkTracks).toHaveBeenCalledWith([track]);
        expect(data.listBannedTracks).toHaveBeenCalledWith([trackId]);
    });
});
