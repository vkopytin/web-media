import { SpotifyAdapter } from '../../adapter/spotify';
import { mocked } from 'ts-jest/utils';
import { DataStorage } from '../../data/dataStorage';
import { Service } from '../../service';
import { HomeViewModel } from '../homeViewModel';

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
    const MockedSpotifyAdapter = mocked(SpotifyAdapter, true);
    let vm: HomeViewModel;
    let srv: Service;

    beforeAll(async () => {
        srv = new Service();
        vm = new HomeViewModel(srv);
        const res = await vm.isInit;
        expect(res).toBeTruthy();
    });

    afterAll(() => {
        MockedSpotifyAdapter.mockClear();
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

        expect(srv.spotifyService!.val.adapter.play).toBeCalledWith(null, ['recommendation:uri-01'], 'recommendation:uri-01');
    });

    it('Should resume playback', async () => {
        jest.spyOn(srv.spotifyPlayerService!.val.player, 'resume').mockImplementation(() => Promise.resolve());

        await vm.resume();

        expect(srv.spotifyPlayerService!.val.player.resume).toBeCalledWith();
    });

    it('Should like track', async () => {
        jest.spyOn(srv.spotifyService!.val.adapter, 'addTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.likeTrack(vm.tracks[0]);

        expect(srv.spotifyService!.val.adapter.addTracks).toBeCalledWith(['recommendation-01']);
    });

    it('Should unlike track', async () => {
        jest.spyOn(srv.spotifyService!.val.adapter, 'removeTracks').mockImplementation(() => Promise.resolve({} as any));
        await vm.unlikeTrack(vm.tracks[0]);

        expect(srv.spotifyService!.val.adapter.removeTracks).toBeCalledWith(['recommendation-01']);
    });
});
