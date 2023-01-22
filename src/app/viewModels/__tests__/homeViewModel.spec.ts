/* eslint-disable */

import { SpotifyAdapter } from '../../adapter/spotify';
import { DataStorage } from '../../data/dataStorage';
import { AppService } from '../../service';
import { HomeViewModel } from '../homeViewModel';
import { SpotifyService } from '../../service/spotify';
import { SpotifyPlayerService } from '../../service/spotifyPlayer';
import { SettingsService } from '../../service/settings';
import { SpotifySyncService } from '../../service/spotifySyncService';
import { DataService } from '../../service/dataService';
import { LoginService } from '../../service/loginService';
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
    let adapter: SpotifyAdapter;
    let vm: HomeViewModel;
    let service: AppService;
    let mockedInit: jest.SpyInstance<ReturnType<HomeViewModel['init']>>;
    let spotifySync: SpotifySyncService;
    let spotify: SpotifyService;
    let spotifyPlayer: SpotifyPlayerService;
    let dataService: DataService;
    let login: LoginService;

    beforeAll(async () => {
        adapter = new SpotifyAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        login = new LoginService(settings);
        spotify = new SpotifyService(adapter);
        spotifyPlayer = new SpotifyPlayerService(settings);
        dataService = new DataService();
        spotifySync = new SpotifySyncService(dataService, spotify);
        service = new AppService(settings, login, dataService, spotify, spotifySync, spotifyPlayer);
        mockedInit = jest.spyOn(HomeViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        vm = new HomeViewModel(dataService, spotify, spotifyPlayer, {} as any);
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

        expect(adapter.play).toHaveBeenCalledWith(['recommendation:uri-01'], 'recommendation:uri-01');
    });

    it('Should resume playback', async () => {
        jest.spyOn(spotifyPlayer.player!, 'resume').mockImplementation(() => Promise.resolve());

        await vm.resume();

        expect(spotifyPlayer.player!.resume).toHaveBeenCalledWith();
    });

    it('Should like track', async () => {
        jest.spyOn(adapter, 'addTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.likeTrack(vm.tracks[0]);

        expect(adapter.addTracks).toHaveBeenCalledWith(['recommendation-01']);
    });

    it('Should unlike track', async () => {
        vm.tracks = [new TrackViewModelItem({} as any, 0)];
        jest.spyOn(adapter, 'removeTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.unlikeTrack(vm.tracks[0]);

        expect(adapter.removeTracks).toHaveBeenCalledWith(['recommendation-01']);
    });
});
