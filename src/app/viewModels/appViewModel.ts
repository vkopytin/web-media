import $ from 'jquery';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IDevice, IResponseResult, ITrack, IUserInfo } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifySyncService } from '../service/spotifySyncService';
import { assertNoErrors, current, State } from '../utils';
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
    @State refreshDevicesCommand = { exec: () => this.updateDevices() };

    switchDeviceCommand$: BehaviorSubject<{ exec: (a) => Promise<void> }>;
    @State switchDeviceCommand = { exec: (device: DeviceViewModelItem) => this.switchDevice(device) };

    refreshTokenCommand$: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State refreshTokenCommand = { exec: () => this.refreshToken() };

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

    isInit = _.delay(() => {
        this.init();
        this.startSync();
        this.connect();
        this.fetchData();
    });

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
        const syncServiceResult = await this.ss.service(SpotifySyncService);
        if (assertNoErrors(syncServiceResult, e => this.errors = e)) {
            return;
        }
        const syncService = syncServiceResult.val;
        this.isSyncing = 1;
        try {
            await syncService.syncData();
        } finally {
            this.isSyncing = 0;
        }
    }

    async refreshToken() {
        const tokenUrlResult = await this.ss.getSpotifyAuthUrl();
        if (assertNoErrors(tokenUrlResult, e => this.errors = e)) {

            return;
        }
        const spotifyAuthUrl = tokenUrlResult.val as string;
        this.autoRefreshUrl = spotifyAuthUrl + '23';
        console.log('updating token');
    }

    async connect() {
        const isLoggedInResult = await this.ss.isLoggedIn();

        if (assertNoErrors(isLoggedInResult, e => this.errors = e)) {
            return;
        }

        this.openLogin = !isLoggedInResult.val;

        const playerResult = await this.ss.spotifyPlayer();
        if (assertNoErrors(playerResult, e => this.errors = e)) {
            return;
        }
        const updateDevicesHandler = async (eventName: string, device: { device_id: string; }) => {
            await this.updateDevices();
            if (!this.currentDevice) {
                this.ss.player(device.device_id, false);
            }
            playerResult.val.off('ready', updateDevicesHandler);
        };
        playerResult.val.on('ready', updateDevicesHandler);
    }

    async fetchData() {
        const userInfoResult = await this.ss.profile();

        if (assertNoErrors(userInfoResult, e => this.errors = e)) {
            return;
        }
        this.profile = userInfoResult.val;

        await this.updateDevices();
        const topTracksResult = await this.ss.listTopTracks();
        if (assertNoErrors(topTracksResult, e => this.errors = e)) {
            return;
        }
        const topTracks = topTracksResult.val as IResponseResult<ITrack>;
        this.topTracks = _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index));
    }

    async updateDevices() {
        const devicesResult = await this.ss.listDevices();

        if (!devicesResult.isError) {
            const devices = devicesResult.val as IDevice[];
            this.devices = _.map(devices, item => new DeviceViewModelItem(item));
        }

        const currentDevice = _.find<DeviceViewModelItem>(this.devices, d => d.isActive()) || null;
        this.currentDevice = currentDevice;
    }

    switchDevice(device: DeviceViewModelItem) {
        this.ss.player(device.id(), true);
        _.delay(() => {
            this.updateDevices();
        }, 1000);
    }
}

export { AppViewModel };

