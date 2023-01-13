import { SpotifyAdapter } from '../../adapter/spotify';
import { mocked } from 'ts-jest/utils';
import { DataStorage } from '../../data/dataStorage';
import { Service } from '../../service';
import { AppViewModel } from '../appViewModel';


jest.mock('../../adapter/spotify', () => {
    return {
        SpotifyAdapter: jest.fn().mockImplementation(() => {
            return {
                me: jest.fn().mockImplementation(() => Promise.resolve({ email: 'test@test.test' })),
                seek: jest.fn().mockImplementation(() => Promise.resolve(true)),
                myTopTracks: jest.fn().mockImplementation(() => Promise.resolve({ items: [{ id: 'track-1', name: 'track-name-1' }] })),
                devices: jest.fn().mockImplementation(() => Promise.resolve({ devices: [{ id: 'device-01', is_active: true }] })),
                player: jest.fn().mockImplementation(() => Promise.resolve({})),
                tracks: jest.fn().mockImplementation(() => Promise.resolve({
                    items: [{
                        track: {
                            id: 'track-01',
                            uri: 'track:uri-01',
                            album: { id: 'album-01' },
                            images: [],
                            artists: []
                        }
                    }]
                })),
                myPlaylists: jest.fn().mockImplementation(() => Promise.resolve({ items: [] })),
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
            addListener() {
                return Promise.resolve(true);
            },
            connect() {
                return Promise.resolve(true);
            }
        };

        return Player;
    })()
} as any;

describe('App View Model', () => {
    const MockedSpotifyAdapter = mocked(SpotifyAdapter, true);
    let vm: AppViewModel;
    let srv: Service;
    let mockedInit: jest.SpyInstance<ReturnType<AppViewModel['init']>>;

    beforeEach(async () => {
        srv = new Service();
        mockedInit = jest.spyOn(AppViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        vm = new AppViewModel(srv);
        const res = await vm.isInit;
        expect(res).toBeTruthy();
    });

    afterEach(() => {
        MockedSpotifyAdapter.mockClear();
        mockedInit.mockClear();
    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
        expect(vm.openLogin).toBeFalsy();
    });

    it('Should have url on refresh token', async () => {
        await vm.refreshToken();

        expect(vm.autoRefreshUrl).toContain('redirect_uri=');
    });

    it('Should fetch data', async () => {
        await vm.fetchData();

        expect(vm.topTracks[0].id()).toEqual('track-1');
        expect(vm.topTracks[0].name()).toEqual('track-name-1');
    });

    it('Should fetch devices', async () => {
        await vm.updateDevices();

        expect(vm.devices[0].id()).toBe('device-01');
        expect(vm.currentDevice!.id()).toBe('device-01');
    });

    it('Should catch error when fetch devices', async () => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'devices').mockImplementation(() => {
            throw new Error('fake error');
        });

        await vm.updateDevices();

        expect(vm.errors).toHaveLength(1);
        console.log(vm.errors[0].error);

        expect(vm.devices[0].id()).toBe('device-01');
        expect(vm.currentDevice!.id()).toBe('device-01');
    });

    it('Should switch device', async () => {
        await vm.switchDevice(vm.currentDevice!);

        expect(vm.devices[0].id()).toBe('device-01');
        expect(vm.currentDevice!.id()).toBe('device-01');
    });
});
