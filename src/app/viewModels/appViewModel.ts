import * as _ from 'underscore';
import { AppService, LogService } from '../service';
import { LoginService } from '../service/loginService';
import { MediaService } from '../service/mediaService';
import { PlaybackService } from '../service/playbackService';
import { DataSyncService } from '../service/dataSyncService';
import { asyncDelay, Binding, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { RemotePlaybackService } from '../service/remotePlaybackService';
import { ITrack, IUserInfo } from '../ports/iMediaProt';


type PanelType = 'home' | 'playlists' | 'profile' | 'releases' | 'search' | 'tracks';

class AppViewModel {
    @State openLogin = true;
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

    @Binding((v: AppViewModel) => v.logService, 'errors')
    errors!: Result[];

    updateDevicesHandler = async (eventName: string, device: { device_id: string; }): Promise<void> => {
        await this.updateDevices();
        if (!this.currentDevice) {
            const res = await this.remotePlayback.player(device.device_id, false);
            res.error(this.logService.logError);
        }
    };

    constructor(
        private logService: LogService,
        private app: AppService,
        private login: LoginService,
        private dataSync: DataSyncService,
        private media: MediaService,
        private playback: PlaybackService,
        private remotePlayback: RemotePlaybackService,
    ) {

    }

    async init(): Promise<void> {
        this.attachToWindowMessageEvent();
        await this.connect();
        await this.fetchData();
        this.openLogin = false;
        await this.startSync();
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
                    this.openLogin = !value;
                default:
                    break;
            }
        });
    }

    async startSync(): Promise<void> {
        this.isSyncing = 1;
        const res = await this.dataSync.syncData();
        res.error(this.logService.logError);
        this.isSyncing = 0;
    }

    async refreshToken(): Promise<void> {
        const tokenUrlResult = await this.login.getSpotifyAuthUrl();
        console.log('updating token...');

        tokenUrlResult.map(spotifyAuthUrl => this.autoRefreshUrl = spotifyAuthUrl + '23')
            .error(this.logService.logError);
    }

    async connect(): Promise<void> {
        const isLoggedInResult = await this.app.isLoggedIn();
        const isLoggedIn = isLoggedInResult.match(
            r => r,
            e => (this.logService.logError(e), false)
        );
        this.openLogin = !isLoggedIn;

        this.playback.on('ready', this.updateDevicesHandler);
        this.playback.on('authenticationError', (error: { message?: string; }) => {
            console.log('Error before refreshing token', error);
            this.refreshTokenCommand.exec();
        });
    }

    async fetchData(): Promise<void> {
        const userInfoResult = await this.media.profile();
        userInfoResult.map(r => this.profile = r)
            .error(this.logService.logError);

        await this.updateDevices();

        const topTracksResult = await this.media.listTopTracks();
        this.topTracks = topTracksResult.match(
            topTracks => _.map(topTracks.items, (track: ITrack, index) => TrackViewModelItem.fromTrack(track, index)),
            e => (this.logService.logError(e), [])
        );
    }

    async updateDevices(): Promise<void> {
        const devicesResult = await this.remotePlayback.listDevices();
        devicesResult
            .map(devices => this.devices = _.map(devices, item => DeviceViewModelItem.fromDevice(item)))
            .error(this.logService.logError);

        const currentDevice = _.find(this.devices, d => d.isActive()) || null;
        this.currentDevice = currentDevice;
    }

    async switchDevice(device: DeviceViewModelItem): Promise<void> {
        const res = await this.remotePlayback.player(device.id(), true);
        res.error(this.logService.logError);

        await asyncDelay(1000);
        res.map(() => this.updateDevices());
    }
}

export { AppViewModel };

