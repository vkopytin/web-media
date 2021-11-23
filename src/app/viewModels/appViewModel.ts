import $ from 'jquery';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IUserInfo } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifySyncService } from '../service/spotifySyncService';
import { current, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


type PanelType = 'home' | 'playlists' | 'profile' | 'releases' | 'search' | 'tracks';

class AppViewModel {
    openLogin$: BehaviorSubject<boolean>;
    @State openLogin = false;

    currentPanel$: BehaviorSubject<PanelType>;
    @State currentPanel: PanelType = 'home';

    devices$: BehaviorSubject<DeviceViewModelItem[]>;
    @State devices: DeviceViewModelItem[] = [];

    profile$: BehaviorSubject<IUserInfo>;
    @State profile: IUserInfo = {};

    refreshDevicesCommand$: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State refreshDevicesCommand = Scheduler.Command(() => this.updateDevices());

    switchDeviceCommand$: BehaviorSubject<{ exec: (a) => Promise<void> }>;
    @State switchDeviceCommand = Scheduler.Command((device: DeviceViewModelItem) => this.switchDevice(device));

    refreshTokenCommand$: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State refreshTokenCommand = Scheduler.Command(() => this.refreshToken());

    currentTrackId$: BehaviorSubject<string>;
    @State currentTrackId = '';

    topTracks$: BehaviorSubject<TrackViewModelItem[]>;
    @State topTracks = [] as TrackViewModelItem[];

    currentDevice$: BehaviorSubject<DeviceViewModelItem>;
    @State currentDevice = null as DeviceViewModelItem;

    autoRefreshUrl$: BehaviorSubject<string>;
    @State autoRefreshUrl = '';

    errors$: BehaviorSubject<AppViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    isSyncing$: BehaviorSubject<AppViewModel['isSyncing']>;
    @State isSyncing = 0;

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.init();
        await this.startSync();
        await this.connect();
        await this.fetchData();

        resolve(true);
    }));

    constructor(private ss = current(Service)) {

    }

    async init() {
        if (window.parent === window) {
            $(window).on('message', async evnt => {
                const [eventName, value] = (evnt.originalEvent as any).data;
                switch (eventName) {
                    case 'accessToken':
                        this.autoRefreshUrl = '';
                        await this.ss.refreshToken(value);
                        this.openLogin = false;
                    default:
                        break;
                }
            });
        }
    }

    async startSync() {
        this.isSyncing = 1;
        const syncServiceResult = await this.ss.service(SpotifySyncService);
        const res = await syncServiceResult.cata(syncService => syncService.syncData());
        res.assert(e => this.errors = [e]);

        this.isSyncing = 0;
    }

    async refreshToken() {
        const tokenUrlResult = await this.ss.getSpotifyAuthUrl();

        console.log('updating token');
        tokenUrlResult.assert(e => this.errors = [e])
            .cata(spotifyAuthUrl => this.autoRefreshUrl = spotifyAuthUrl + '23');
    }

    async connect() {
        const isLoggedInResult = await this.ss.isLoggedIn();
        this.openLogin = isLoggedInResult.assert(e => this.errors = [e])
            .cata(r => !r);

        const playerResult = await this.ss.spotifyPlayer();
        playerResult.assert(e => this.errors = [e])
            .cata((player) => {
                const updateDevicesHandler = async (eventName: string, device: { device_id: string; }) => {
                    await this.updateDevices();
                    if (!this.currentDevice) {
                        await this.ss.player(device.device_id, false);
                    }
                    player.off('ready', updateDevicesHandler);
                };
                player.on('ready', updateDevicesHandler);
            });
    }

    async fetchData() {
        const userInfoResult = await this.ss.profile();
        userInfoResult.assert(e => this.errors = [e])
            .cata(r => this.profile = r);

        await this.updateDevices();

        const topTracksResult = await this.ss.listTopTracks();
        this.topTracks = topTracksResult.assert(e => this.errors = [e])
            .cata(topTracks => _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index)));
    }

    async updateDevices() {
        const devicesResult = await this.ss.listDevices();
        devicesResult.assert(e => this.errors = [e])
            .cata(devices => this.devices = _.map(devices, item => new DeviceViewModelItem(item)));

        const currentDevice = _.find(this.devices, d => d.isActive()) || null;
        this.currentDevice = currentDevice;
    }

    async switchDevice(device: DeviceViewModelItem) {
        const res = await this.ss.player(device.id(), true);

        res.assert(e => this.errors = [e])
            .cata(() => _.delay(() => {
                this.updateDevices();
            }, 1000));
    }
}

export { AppViewModel };

