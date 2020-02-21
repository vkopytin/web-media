import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { IDevice, IUserInfo } from '../service/adapter/spotify';
import { DeviceViewModelItem } from './deviceViewModelItem';
import { current } from '../utils';


const panels = ['home', 'profile'];

class AppViewModel extends Events {

    settings = {
        openLogin: false,
        currentPanel: 'home' as 'home' | 'profile',
        currentDevice: null as DeviceViewModelItem
    };

    currentDeviceCommand = {
        exec: (device: DeviceViewModelItem) => this.currentDevice(device)
    }
    devicesArray = [] as any[];
    userInfo = {} as IUserInfo;

    isInit = _.delay(() => this.loadData());

    constructor(private ss = current(Service)) {
        super();

        (async function (this: AppViewModel) {
            const isLoggedInResult = await this.ss.isLoggedIn();

            if (isLoggedInResult.error) {
                this.openLogin(true);
            }

            this.openLogin(!isLoggedInResult.val);

            const playerResult = await this.ss.spotifyPlayer();
            if (playerResult.isError) {
                return;
            }
            playerResult.val.on('ready', () => this.updateDevices());
        }).call(this);
    }

    async loadData() {
        const userInfoResult = await this.ss.profile();

        if (!userInfoResult.isError) {
            this.profile(userInfoResult.val);
        }

        await this.updateDevices();
    }

    async updateDevices() {
        const devicesResult = await this.ss.listDevices();

        if (!devicesResult.isError) {
            const devices = devicesResult.val as IDevice[];
            this.devices(_.map(devices, item => new DeviceViewModelItem(item)));
        }

        const currentDevice = _.find(this.devices(), d => d.isActive()) || _.last(this.devices());
        this.currentDevice(currentDevice);
    }

    openLogin(val?) {
        if (arguments.length) {
            this.settings.openLogin = !!val;
            this.trigger('change:openLogin');
        }

        return this.settings.openLogin;
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

    devices(val?) {
        if (arguments.length && this.devicesArray !== val) {
            this.devicesArray = val;
            this.trigger('change:devices');
        }

        return this.devicesArray;
    }

    profile(val?) {
        if (arguments.length && this.userInfo !== val) {
            this.userInfo = val;
            this.trigger('change:profile');
        }

        return this.userInfo;
    }
}

export { AppViewModel };
