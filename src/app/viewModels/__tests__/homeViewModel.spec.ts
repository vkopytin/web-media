/* eslint-disable */

import { SpotifyMediaAdapter } from '../../adapter/spotify';
import { SpotifyRemotePlaybackAdapter } from '../../adapter/spotifyRemotePlaybackAdapter';
import { DataStorage } from '../../data/dataStorage';
import { AppService } from '../../service';
import { DataService } from '../../service/dataService';
import { DataSyncService } from '../../service/dataSyncService';
import { LoginService } from '../../service/loginService';
import { MediaService } from '../../service/mediaService';
import { PlaybackService } from '../../service/playbackService';
import { RemotePlaybackService } from '../../service/remotePlaybackService';
import { SettingsService } from '../../service/settings';
import { HomeViewModel } from '../homeViewModel';
import { TrackViewModelItem } from '../trackViewModelItem';


jest.mock('../../adapter/spotify', () => {
    return {
        SpotifyAdapter: jest.fn().mockImplementation(() => {
            return {
                recommendations: jest.fn().mockImplementation(() => Promise.resolve({ tracks: [{ id: 'recommendation-01', uri: 'recommendation:uri-01' }] })),
                tracks: jest.fn().mockImplementation(() => Promise.resolve({ items: [{ track: { id: 'track-01', uri: 'track:uri-01' } }] })),
                hasTracks: jest.fn().mockImplementation(() => Promise.resolve([true])),
                play: jest.fn().mockImplementation((deviceId, tracksUriList, indexOrUri) => Promise.resolve(true)),
                addTracks: jest.fn().mockImplementation(() => Promise.resolve({})),
                removeTracks: jest.fn().mockImplementation(() => Promise.resolve({})),
            };
        })
    };
});

DataStorage.dbType = 'inMemory';

describe('Home View Model', () => {
    let spotifyMedia: SpotifyMediaAdapter;
    let spotifyRemotePlaybackAdapter: SpotifyRemotePlaybackAdapter;
    let vm: HomeViewModel;
    let service: AppService;
    let mockedInit: jest.SpyInstance<ReturnType<HomeViewModel['init']>>;
    let dataSync: DataSyncService;
    let media: MediaService;
    let remotePlaybackService: RemotePlaybackService;
    let playback: PlaybackService;
    let dataService: DataService;
    let login: LoginService;

    beforeAll(async () => {
        spotifyMedia = new SpotifyMediaAdapter('key');
        spotifyRemotePlaybackAdapter = new SpotifyRemotePlaybackAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        login = new LoginService(settings);
        media = new MediaService(spotifyMedia);
        remotePlaybackService = new RemotePlaybackService(spotifyRemotePlaybackAdapter);
        playback = new PlaybackService(settings);
        dataService = new DataService();
        dataSync = new DataSyncService(dataService, media);
        service = new AppService(settings, login, dataService, media, dataSync, playback, remotePlaybackService);
        mockedInit = jest.spyOn(HomeViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        vm = new HomeViewModel(dataService, media, playback, {} as any);
    });

    afterAll(() => {

    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
    });

    it('Should fetch data', async () => {
        await vm.fetchData();

        expect(vm.tracks.length).toEqual(1);
        expect(vm.tracks[0].id()).toEqual('recommendation-01');
    });

    it('Should check tracks', async () => {
        await vm.checkTracks(vm.tracks);

        expect(vm.likedTracks.length).toEqual(1);
    });

    it('Should play track', async () => {
        await vm.playInTracks(vm.tracks[0]);

        expect(spotifyRemotePlaybackAdapter.play).toHaveBeenCalledWith(['recommendation:uri-01'], 'recommendation:uri-01');
    });

    it('Should resume playback', async () => {
        jest.spyOn(playback.player!, 'resume').mockImplementation(() => Promise.resolve());

        await vm.resume();

        expect(playback.player!.resume).toHaveBeenCalledWith();
    });

    it('Should like track', async () => {
        jest.spyOn(spotifyMedia, 'addTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.likeTrack(vm.tracks[0]);

        expect(spotifyMedia.addTracks).toHaveBeenCalledWith(['recommendation-01']);
    });

    it('Should unlike track', async () => {
        vm.tracks = [new TrackViewModelItem({} as any, 0)];
        jest.spyOn(spotifyMedia, 'removeTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.unlikeTrack(vm.tracks[0]);

        expect(spotifyMedia.removeTracks).toHaveBeenCalledWith(['recommendation-01']);
    });
});
