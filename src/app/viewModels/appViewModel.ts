import * as _ from 'underscore';
import { ISpotifySong, ITrack, IUserInfo } from '../adapter/spotify';
import { AppService } from '../service';
import { LoginService } from '../service/loginService';
import { SpotifyService } from '../service/spotify';
import { SpotifyPlayerService } from '../service/spotifyPlayer';
import { SpotifySyncService } from '../service/spotifySyncService';
import { asyncDelay, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


type PanelType = 'home' | 'playlists' | 'profile' | 'releases' | 'search' | 'tracks';

class AppViewModel {
    @State errors: Result[] = [];
    @State openLogin = false;
    @State currentPanel: PanelType = 'home';
    @State devices: DeviceViewModelItem[] = [];
    @State profile: IUserInfo = {};
    @State currentTrackId = '';
    @State topTracks: TrackViewModelItem[] = [];
    @State currentDevice: DeviceViewModelItem | null = null;
    @State autoRefreshUrl = '';
    @State isSyncing = 0;

    @State refreshDevicesCommand = Scheduler.Command(() => this.updateDevices());
    @State switchDeviceCommand = Scheduler.Command((device: DeviceViewModelItem) => this.switchDevice(device));
    @State refreshTokenCommand = Scheduler.Command(() => this.refreshToken());

    updateDevicesHandler = async (eventName: string, device: { device_id: string; }): Promise<void> => {
        await this.updateDevices();
        if (!this.currentDevice) {
            const res = await this.spotify.player(device.device_id, false);
            res.error(e => this.errors = [Result.error(e)]);
        }
    };

    constructor(
        private login: LoginService,
        private spotifySync: SpotifySyncService,
        private spotify: SpotifyService,
        private spotifyPlayer: SpotifyPlayerService,
        private app: AppService,
    ) {

    }

    async init(): Promise<void> {
        this.attachToWindowMessageEvent();
        await this.startSync();
        await this.connect();
        await this.fetchData();
    }

    attachToWindowMessageEvent(): void {
        window.addEventListener('message', async evnt => {
            if (!(evnt.data instanceof Array)) {
                return;
            }
            const [eventName, value] = evnt.data;
            switch (eventName) {
                case 'accessToken':
                    this.autoRefreshUrl = '';
                    await this.app.refreshToken(value);
                    this.openLogin = false;
                default:
                    break;
            }
        });
    }

    async startSync(): Promise<void> {
        this.isSyncing = 1;
        const res = await this.spotifySync.syncData();
        res.error(e => this.errors = [Result.error(e)]);
        this.isSyncing = 0;
    }

    async refreshToken(): Promise<void> {
        const tokenUrlResult = await this.login.getSpotifyAuthUrl();
        console.log('updating token...');

        tokenUrlResult.map(spotifyAuthUrl => this.autoRefreshUrl = spotifyAuthUrl + '23')
            .error(e => this.errors = [Result.error(e)]);
    }

    async connect(): Promise<void> {
        const isLoggedInResult = await this.app.isLoggedIn();
        this.openLogin = isLoggedInResult.match(
            r => !r,
            e => (this.errors = [Result.error(e)], false)
        );

        this.spotifyPlayer.on('ready', this.updateDevicesHandler);
    }

    async fetchData(): Promise<void> {
        const userInfoResult = await this.spotify.profile();
        userInfoResult.error(e => this.errors = [Result.error(e)])
            .map(r => this.profile = r);

        await this.updateDevices();

        const topTracksResult = await this.spotify.listTopTracks();
        this.topTracks = topTracksResult.match(
            topTracks => _.map(topTracks.items, (track: ITrack, index) => new TrackViewModelItem({ track } as ISpotifySong, index)),
            e => (this.errors = [Result.error(e)], [])
        );
    }

    async updateDevices(): Promise<void> {
        const devicesResult = await this.spotify.listDevices();
        devicesResult
            .map(devices => this.devices = _.map(devices, item => new DeviceViewModelItem(item)))
            .error(e => this.errors = [Result.error(e)]);

        const currentDevice = _.find(this.devices, d => d.isActive()) || null;
        this.currentDevice = currentDevice;
    }

    async switchDevice(device: DeviceViewModelItem): Promise<void> {
        const res = await this.spotify.player(device.id(), true);
        res.error(e => this.errors = [Result.error(e)]);

        await asyncDelay(1000);
        res.map(() => this.updateDevices());
    }
}

export { AppViewModel };

