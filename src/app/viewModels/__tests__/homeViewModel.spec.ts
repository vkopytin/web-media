/* eslint-disable */

import { SuggestionsService } from '../../service/suggestionsService';
import { DataService } from '../../service/dataService';
import { LoginService } from '../../service/loginService';
import { MediaService } from '../../service/mediaService';
import { PlaybackService } from '../../service/playbackService';
import { Result } from '../../utils/result';
import { HomeViewModel } from '../homeViewModel';
import { TrackViewModelItem } from '../trackViewModelItem';
import { LogService } from '../../service/logService';

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

    afterAll(() => {

    });

    xit('Should be created', () => {
        expect(homeVm).toBeTruthy();
    });

    xit('Should fetch data', async () => {
        await homeVm.fetchData();

        expect(homeVm.tracks.length).toEqual(1);
        expect(homeVm.tracks[0].id()).toEqual('recommendation-01');
    });

    xit('Should check tracks', async () => {
        await homeVm.checkBannedTracks();

        expect(homeVm.likedTracks.length).toEqual(1);
    });

    xit('Should play track', async () => {
        const track = new TrackViewModelItem({} as any, 0);
        jest.spyOn(track, 'playTracks').mockImplementation(() => Promise.resolve());
        await homeVm.playInTracks(track);

        expect(track.playTracks).toHaveBeenCalledWith([track]);
    });

    xit('Should resume playback', async () => {
        jest.spyOn(playback.player!, 'resume').mockImplementation(() => Promise.resolve());

        await homeVm.resume();

        expect(playback.player!.resume).toHaveBeenCalledWith();
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
