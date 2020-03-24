import $ from 'jquery';
import * as _ from 'underscore';
import { IDevice, IResponseResult, ITrack, IUserInfo } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { SpotifySyncService } from '../service/spotifySyncService';
import { assertNoErrors, current } from '../utils';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class AppViewModel extends ViewModel<AppViewModel['settings']> {

    settings = {
        ...(this as any as ViewModel).settings,
        openLogin: false,
        currentPanel: 'home' as 'home' | 'profile',
        currentDevice: null as DeviceViewModelItem,
        currentTrackId: '',
        devices: [] as DeviceViewModelItem[],
        topTracks: [] as TrackViewModelItem[],
        spotifyAuthUrl: '',
        autoRefreshUrl: ''
    };

    switchDeviceCommand = { exec: (device: DeviceViewModelItem) => this.switchDevice(device) };
    refreshTokenCommand = { exec: () => this.refreshToken() };
    refreshDevicesCommand = { exec: () => this.updateDevices() };
    userInfo = {} as IUserInfo;

    isInit = _.delay(() => {
        this.init();
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

    async init() {
        if (window.parent === window) {
            $(window).on('message', async evnt => {
                const [eventName, value] = (evnt.originalEvent as any).data;
                switch (eventName) {
                    case 'accessToken':
                        this.prop('autoRefreshUrl', '');
                        await this.ss.refreshToken(value);
                        this.openLogin(false);
                    default:
                        break;
                }
            });
        }
    }

    async startSync() {
        const syncServiceResult = await this.ss.service(SpotifySyncService);
        if (assertNoErrors(syncServiceResult, e => this.errors(e))) {
            return;
        }
        const syncService = syncServiceResult.val;
        syncService.syncData();
    }

    async refreshToken() {
        const tokenUrlResult = await this.ss.getSpotifyAuthUrl();
        if (assertNoErrors(tokenUrlResult, e => this.errors(e))) {

            return;
        }
        const spotifyAuthUrl = tokenUrlResult.val as string;
        this.prop('autoRefreshUrl', spotifyAuthUrl + '23');
        console.log('updating token');
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
        const updateDevicesHandler = async (eventName: string, device: { device_id: string; }) => {
            await this.updateDevices();
            if (!this.currentDevice()) {
                this.ss.player(device.device_id, false);
            }
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

