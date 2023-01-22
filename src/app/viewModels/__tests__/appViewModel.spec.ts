/* eslint-disable */

import { SpotifyAdapter } from '../../adapter/spotify';
import { DataStorage } from '../../data/dataStorage';
import { AppViewModel } from '../appViewModel';
import { SpotifySyncService } from '../../service/spotifySyncService';
import { SpotifyService } from '../../service/spotify';
import { SpotifyPlayerService } from '../../service/spotifyPlayer';
import { AppService } from '../../service';
import { SettingsService } from '../../service/settings';
import { DataService } from '../../service/dataService';
import { DeviceViewModelItem } from '../deviceViewModelItem';
import { LoginService } from '../../service/loginService';


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

jest.mock('../../service/dataService', () => {
    return {
        DataService: jest.fn().mockImplementation(() => {
            return {

            };
        })
    };
});

jest.mock('../../service/spotifySyncService', () => {
    return {
        SpotifySyncService: jest.fn().mockImplementation(() => {
            return {
                syncData: jest.fn().mockImplementation(() => Promise.resolve()),
            };
        })
    };
});

jest.mock('../deviceViewModelItem', () => {
    return {
        DeviceViewModelItem: jest.fn().mockImplementation(() => {
            return {

            };
        })
    };
});

DataStorage.dbType = 'inMemory';


describe('App View Model', () => {
    let adapter: SpotifyAdapter;
    let vm: AppViewModel;
    let service: AppService;
    let mockedInit: jest.SpyInstance<ReturnType<AppViewModel['init']>>;
    let spotifySync: SpotifySyncService;
    let spotify: SpotifyService;
    let spotifyPlayer: SpotifyPlayerService;
    let dataService: DataService;
    let login: LoginService;

    beforeEach(async () => {
        adapter = new SpotifyAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        login = new LoginService(settings);
        spotify = new SpotifyService(adapter);
        spotifyPlayer = new SpotifyPlayerService(settings);
        dataService = new DataService();
        spotifySync = new SpotifySyncService(dataService, spotify);
        service = new AppService(settings, login, dataService, spotify, spotifySync, spotifyPlayer);
        mockedInit = jest.spyOn(AppViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        vm = new AppViewModel(login, spotifySync, spotify, spotifyPlayer, service);
    });

    afterEach(() => {
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
        jest.spyOn(adapter, 'devices').mockImplementation(() => {
            throw new Error('fake error');
        });

        await vm.updateDevices();

        expect(vm.errors.length).toEqual(1);
        console.log(vm.errors[0].error);

        expect(vm.devices[0].id()).toBe('device-01');
        expect(vm.currentDevice!.id()).toBe('device-01');
    });

    it('Should switch device', async () => {
        const device = new DeviceViewModelItem({ id: 'test', is_active: false, is_private_session: true, is_restricted: true, name: 'test', type: 'test', volume_percent: 0 });
        await vm.switchDevice(device);

        expect(vm.devices[0].id()).toBe('device-01');
        expect(vm.currentDevice!.id()).toBe('device-01');
    });
});
