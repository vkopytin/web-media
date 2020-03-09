import * as _ from 'underscore';
import { IDevice, IResponseResult, ITrack, IUserInfo } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { SpotifySyncService } from '../service/spotifySyncService';
import { assertNoErrors, current } from '../utils';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class AppViewModel extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
        openLogin: false,
        currentPanel: 'home' as 'home' | 'profile',
        currentDevice: null as DeviceViewModelItem,
        currentTrackId: '',
        devices: [] as DeviceViewModelItem[],
        topTracks: [] as TrackViewModelItem[]
    };

    switchDeviceCommand = { exec: (device: DeviceViewModelItem) => this.switchDevice(device) };
    userInfo = {} as IUserInfo;

    isInit = _.delay(() => {
        this.startSync();
        this.connect();
        this.fetchData();
    });

    constructor(private ss = current(Service)) {
        super();
    }

    currentPanel(val?) {
        if (arguments.length) {
            this.settings.currentPanel = val;
            this.trigger('change:currentPanel');
        }

        return this.settings.currentPanel;
    }

    currentDevice(val?: DeviceViewModelItem) {
        if (arguments.length) {
            this.settings.currentDevice = val;
            this.trigger('change:currentDevice');
        }

        return this.settings.currentDevice;
    }

    devices(val?: DeviceViewModelItem[]) {
        if (arguments.length && this.settings.devices !== val) {
            this.settings.devices = val;
            this.trigger('change:devices');
        }

        return this.settings.devices;
    }

    profile(val?) {
        if (arguments.length && this.userInfo !== val) {
            this.userInfo = val;
            this.trigger('change:profile');
        }

        return this.userInfo;
    }

    currentTrackId(val?) {
        if (arguments.length && val !== this.settings.currentTrackId) {
            this.settings.currentTrackId = val;
            this.trigger('change:currentTrackId');
        }

        return this.settings.currentTrackId;
    }

    topTracks(val?) {
        if (arguments.length && val !== this.settings.topTracks) {
            this.settings.topTracks = val;
            this.trigger('change:topTracks');
        }

        return this.settings.topTracks;
    }

    openLogin(val?) {
        if (arguments.length) {
            this.settings.openLogin = !!val;
            this.trigger('change:openLogin');
        }

        return this.settings.openLogin;
    }

    async startSync() {
        const syncServiceResult = await this.ss.service(SpotifySyncService);
        if (assertNoErrors(syncServiceResult, e => this.errors(e))) {
            return;
        }
        const syncService = syncServiceResult.val;
        syncService.syncData();
    }

    async connect() {
        const isLoggedInResult = await this.ss.isLoggedIn();

        if (assertNoErrors(isLoggedInResult, e => this.errors(e))) {
            return;
        }

        this.openLogin(!isLoggedInResult.val);

        const playerResult = await this.ss.spotifyPlayer();
        if (assertNoErrors(playerResult, e => this.errors(e))) {
            return;
        }
        const updateDevicesHandler = (eventName: string, device: { device_id: string; }) => {
            if (!this.currentDevice()) {
                this.ss.player(device.device_id, false);
            }
            this.updateDevices();
            playerResult.val.off('ready', updateDevicesHandler);
        };
        playerResult.val.on('ready', updateDevicesHandler);
    }

    async fetchData() {
        const userInfoResult = await this.ss.profile();

        if (assertNoErrors(userInfoResult, e => this.errors(e))) {
            return;
        }
        this.profile(userInfoResult.val);

        await this.updateDevices();
        const topTracksResult = await this.ss.listTopTracks();
        if (assertNoErrors(topTracksResult, e => this.errors(e))) {
            return;
        }
        const topTracks = topTracksResult.val as IResponseResult<ITrack>;
        this.topTracks(_.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index)));
    }

    async updateDevices() {
        const devicesResult = await this.ss.listDevices();

        if (!devicesResult.isError) {
            const devices = devicesResult.val as IDevice[];
            this.devices(_.map(devices, item => new DeviceViewModelItem(item)));
        }

        const currentDevice = _.find<DeviceViewModelItem>(this.devices(), d => d.isActive()) || null;
        this.currentDevice(currentDevice);
    }

    switchDevice(device: DeviceViewModelItem) {
        this.ss.player(device.id(), true);
        _.delay(() => {
            this.updateDevices();
        }, 1000);
    }
}

export { AppViewModel };

