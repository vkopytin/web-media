import { SpotifyAdapter } from '../../adapter/spotify';
import { mocked } from 'ts-jest/utils';
import { DataStorage } from '../../data/dataStorage';
import { Service } from '../../service';
import { HomeViewModel } from '../homeViewModel';
import { SpotifyService } from '../../service/spotify';
import { SpotifyPlayerService } from '../../service/spotifyPlayer';
import { SettingsService } from '../../service/settings';
import { SpotifySyncService } from '../../service/spotifySyncService';
import { DataService } from '../../service/dataService';

let mockSrv: any;

jest.mock('../../adapter/spotify', () => {
    return {
        SpotifyAdapter: jest.fn().mockImplementation(() => {
            return mockSrv = mockSrv || {
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

window.Spotify = {
    Player: (function () {
        function Player() {

        }
        Player.prototype = {
            addListener: jest.fn().mockImplementation(() => Promise.resolve(true)),
            connect: jest.fn().mockImplementation(() => Promise.resolve(true)),
            resume: jest.fn().mockImplementation(() => Promise.resolve(true))
        };

        return Player;
    })()
} as any;

describe('Home View Model', () => {
    let adapter: SpotifyAdapter;
    let vm: HomeViewModel;
    let service: Service;
    let mockedInit: jest.SpyInstance<ReturnType<HomeViewModel['init']>>;
    let spotifySync: SpotifySyncService;
    let spotify: SpotifyService;
    let spotifyPlayer: SpotifyPlayerService;
    let dataService: DataService;

    beforeAll(async () => {
        adapter = new SpotifyAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        spotify = new SpotifyService(adapter);
        spotifyPlayer = new SpotifyPlayerService(settings);
        dataService = new DataService();
        spotifySync = new SpotifySyncService(spotify, dataService);
        mockedInit = jest.spyOn(HomeViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        vm = new HomeViewModel(spotify, spotifyPlayer, service);
        const res = await vm.isInit;
        expect(res).toBeTruthy();
    });

    afterAll(() => {

    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
    });

    it('Should fetch data', async () => {
        await vm.fetchData();

        expect(vm.tracks).toHaveLength(1);
        expect(vm.tracks[0].id()).toEqual('recommendation-01');
    });

    it('Should check tracks', async () => {
        await vm.checkTracks(vm.tracks);

        expect(vm.likedTracks).toHaveLength(1);
    });

    it('Should play track', async () => {
        await vm.playInTracks(vm.tracks[0]);

        expect(adapter.play).toBeCalledWith(null, ['recommendation:uri-01'], 'recommendation:uri-01');
    });

    it('Should resume playback', async () => {
        jest.spyOn(spotifyPlayer.player!, 'resume').mockImplementation(() => Promise.resolve());

        await vm.resume();

        expect(spotifyPlayer.player!.resume).toBeCalledWith();
    });

    it('Should like track', async () => {
        jest.spyOn(adapter, 'addTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.likeTrack(vm.tracks[0]);

        expect(adapter.addTracks).toBeCalledWith(['recommendation-01']);
    });

    it('Should unlike track', async () => {
        jest.spyOn(adapter, 'removeTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.unlikeTrack(vm.tracks[0]);

        expect(adapter.removeTracks).toBeCalledWith(['recommendation-01']);
    });
});
