/* eslint-disable */

import { AppService, LogService } from '../../service';
import { DataSyncService } from '../../service/dataSyncService';
import { LoginService } from '../../service/loginService';
import { MediaService } from '../../service/mediaService';
import { PlaybackService } from '../../service/playbackService';
import { RemotePlaybackService } from '../../service/remotePlaybackService';
import * as ioc from '../../utils/inject';
import { Result } from '../../utils/result';
import { AppViewModel } from '../appViewModel';
import { DeviceViewModelItem } from '../deviceViewModelItem';
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

describe('App View Model', () => {
    let logService: LogService;
    let appVm: AppViewModel;
    let app: AppService;
    let spotifySync: DataSyncService;
    let media: MediaService;
    let playback: PlaybackService;
    let remotePlayback: RemotePlaybackService;
    let login: LoginService;

    beforeEach(async () => {
        logService = new LogService();
        login = new LoginService({} as any);
        spotifySync = new DataSyncService({} as any, {} as any);
        media = new MediaService({} as any);
        playback = new PlaybackService({} as any, {} as any);
        remotePlayback = new RemotePlaybackService({} as any);
        app = new AppService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
        appVm = new AppViewModel(logService, app, login, spotifySync, media, playback, remotePlayback);
    });

    it('Should be created', () => {
        expect(appVm).toBeTruthy();
        expect(appVm.isLoginVisible).toBeTruthy();
    });

    it('Should have url on refresh token', async () => {
        const url = 'test';
        jest.spyOn(login, 'getSpotifyAuthUrl').mockImplementation(() => Promise.resolve(Result.of(url)));

        await appVm.refreshToken();

        expect(appVm.autoRefreshUrl).toContain(url);
    });

    it('Should fetch data', async () => {
        const device = { id: 'test', is_active: true, is_private_session: true, is_restricted: true, name: 'test', type: 'test', volume_percent: 0 };
        const track = { id: 'track-1', name: 'track-name-1' };
        jest.spyOn(media, 'profile').mockImplementation(() => Promise.resolve(Result.of({})));
        jest.spyOn(remotePlayback, 'listDevices').mockImplementation(() => Promise.resolve(Result.of([device])));
        jest.spyOn(media, 'listTopTracks').mockImplementation(
            () => Promise.resolve(Result.of({ items: [track] } as any))
        );
        jest.spyOn(ioc, 'inject').mockImplementation(() => ({}));
        jest.spyOn(TrackViewModelItem.prototype, 'id').mockImplementation(() => track.id);
        jest.spyOn(TrackViewModelItem.prototype, 'name').mockImplementation(() => track.name);
        jest.spyOn(TrackViewModelItem.prototype, 'fetchData').mockImplementation(() => Promise.resolve());

        await appVm.fetchData();

        expect(media.profile).toHaveBeenCalled();
        expect(remotePlayback.listDevices).toHaveBeenCalled();
        expect(media.listTopTracks).toHaveBeenCalled();
    });

    it('Should fetch devices', async () => {
        const device = { id: 'test', is_active: true, is_private_session: true, is_restricted: true, name: 'test', type: 'test', volume_percent: 0 };
        jest.spyOn(remotePlayback, 'listDevices').mockImplementation(() => Promise.resolve(Result.of([device])));

        await appVm.updateDevices();

        expect(appVm.devices[0].id()).toBe(device.id);
        expect(appVm.currentDevice!.id()).toBe(device.id);
    });

    it('Should catch error when fetch devices', async () => {
        jest.spyOn(remotePlayback, 'listDevices').mockImplementation(() => Promise.resolve(Result.error(new Error('error'))));

        await appVm.updateDevices();

        expect(appVm.errors.length).toEqual(1);
    });

    it('Should switch device', async () => {
        const device = { id: 'test', is_active: true, is_private_session: true, is_restricted: true, name: 'test', type: 'test', volume_percent: 0 };
        const deviceItem = new DeviceViewModelItem(device);
        jest.spyOn(remotePlayback, 'player').mockImplementation(() => Promise.resolve(Result.of({} as any)));
        jest.spyOn(remotePlayback, 'listDevices').mockImplementation(() => Promise.resolve(Result.of([device])));

        await appVm.switchDevice(deviceItem);

        expect(appVm.devices[0].id()).toBe(device.id);
        expect(appVm.currentDevice!.id()).toBe(device.id);
    });
});
