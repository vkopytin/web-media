import * as _ from 'underscore';
import { IUserInfo } from '../adapter/spotify';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { SpotifyPlayerService } from '../service/spotifyPlayer';
import { SpotifySyncService } from '../service/spotifySyncService';
import { State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


type PanelType = 'home' | 'playlists' | 'profile' | 'releases' | 'search' | 'tracks';

class AppViewModel {
    @State errors = [] as Result<Error, unknown>[];
    @State openLogin = false;
    @State currentPanel: PanelType = 'home';
    @State devices: DeviceViewModelItem[] = [];
    @State profile: IUserInfo = {};
    @State refreshDevicesCommand = Scheduler.Command(() => this.updateDevices());
    @State switchDeviceCommand = Scheduler.Command((device: DeviceViewModelItem) => this.switchDevice(device));
    @State refreshTokenCommand = Scheduler.Command(() => this.refreshToken());
    @State currentTrackId = '';
    @State topTracks = [] as TrackViewModelItem[];
    @State currentDevice = null as (DeviceViewModelItem | null);
    @State autoRefreshUrl = '';
    @State isSyncing = 0;

    constructor(
        private spotifySyncService: SpotifySyncService,
        private spotifyService: SpotifyService,
        private spotifyPlayerService: SpotifyPlayerService,
        private ss: Service,
    ) {

    }

    async init() {
        this.attachToWindowMessageEvent();
        await this.startSync();
        await this.connect();
        await this.fetchData();
    }

    attachToWindowMessageEvent() {
        window.addEventListener('message', async evnt => {
            if (!(evnt.data instanceof Array)) {
                return;
            }
            const [eventName, value] = evnt.data;
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

    async startSync() {
        this.isSyncing = 1;
        const res = await this.spotifySyncService.syncData();
        res.error(e => this.errors = [Result.error(e as Error)]);
        this.isSyncing = 0;
    }

    async refreshToken() {
        const tokenUrlResult = await this.ss.getSpotifyAuthUrl();
        console.log('updating token...');

        tokenUrlResult.map(spotifyAuthUrl => this.autoRefreshUrl = spotifyAuthUrl + '23')
            .error(e => this.errors = [Result.error(e)]);
    }

    async connect() {
        const isLoggedInResult = await this.ss.isLoggedIn();
        this.openLogin = isLoggedInResult.match(
            r => !r,
            e => (this.errors = [isLoggedInResult], false)
        );

        const updateDevicesHandler = async (eventName: string, device: { device_id: string; }) => {
            await this.updateDevices();
            if (!this.currentDevice) {
                const res = await this.spotifyService.player(device.device_id, false);
                res.error(e => this.errors = [Result.of(e)]);
            }
        };
        this.spotifyPlayerService.on('ready', updateDevicesHandler);
    }

    async fetchData() {
        const userInfoResult = await this.ss.profile();
        userInfoResult.error(e => this.errors = [userInfoResult])
            .map(r => this.profile = r);

        await this.updateDevices();

        const topTracksResult = await this.ss.listTopTracks();
        this.topTracks = topTracksResult.match(
            topTracks => _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index)),
            e => (this.errors = [topTracksResult], [])
        );
    }

    async updateDevices() {
        const devicesResult = await this.ss.listDevices();
        devicesResult
            .map(devices => this.devices = _.map(devices, item => new DeviceViewModelItem(item)))
            .error(e => this.errors = [devicesResult]);

        const currentDevice = _.find(this.devices, d => d.isActive()) || null;
        this.currentDevice = currentDevice;
    }

    async switchDevice(device: DeviceViewModelItem) {
        const res = await this.spotifyService.player(device.id(), true);

        res.map(() => _.delay(() => {
            this.updateDevices();
        }, 1000)).error(e => this.errors = [res]);
    }
}

export { AppViewModel };

