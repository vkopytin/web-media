import * as _ from 'underscore';
import { IUserInfo } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { current, State, ValueContainer } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


class UserProfileViewModel {
    errors$: ValueContainer<UserProfileViewModel['errors'], UserProfileViewModel>;
    @State errors = [] as ServiceResult<any, Error>[];

    isLoggedin$: ValueContainer<boolean, UserProfileViewModel>;
    @State isLoggedin = false;

    profile$: ValueContainer<UserProfileViewModel['profile'], UserProfileViewModel>;
    @State profile: IUserInfo = {};

    currentTrackId$ = this.appViewModel.currentTrackId$;
    @State currentTrackId = '';

    topTracks$: ValueContainer<UserProfileViewModel['topTracks'], UserProfileViewModel>;
    @State topTracks = [] as TrackViewModelItem[];

    tracks$: ValueContainer<UserProfileViewModel['tracks'], UserProfileViewModel>;
    @State tracks = [] as TrackViewModelItem[];

    spotifyAuthUrl$: ValueContainer<UserProfileViewModel['spotifyAuthUrl'], UserProfileViewModel>;
    @State spotifyAuthUrl = '';

    geniusAuthUrl$: ValueContainer<UserProfileViewModel['geniusAuthUrl'], UserProfileViewModel>;
    @State geniusAuthUrl = '';

    apiseedsKey$: ValueContainer<UserProfileViewModel['apiseedsKey'], UserProfileViewModel>;
    @State apiseedsKey = '';

    logoutCommand$: ValueContainer<UserProfileViewModel['logoutCommand'], UserProfileViewModel>;
    @State logoutCommand = Scheduler.Command(() => this.logout());

    settings = {
        currentTrackId: '',
        spotifyAuthUrl: '',
        geniusAuthUrl: '',
        apiseedsKey: ''
    };

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.fetchData();
        this.apiseedsKey$.subscribe(_.debounce((val) => {
            this.saveApiseedsKey(val);
        }, 300), this);
        resolve(true);
    }));

    constructor(private appViewModel = current(AppViewModel), private ss = current(Service)) {
        
    }

    async fetchData() {
        const settingsResult = await this.ss.service(SettingsService);
        settingsResult.assert(e => this.errors = [e]).cata(() => {
            this.apiseedsKey = settingsResult.val.apiseedsKey();
        });
        const spotifyTokenUrlResult = await this.ss.getSpotifyAuthUrl();
        spotifyTokenUrlResult.assert(e => this.errors = [e]).cata(spotifyAuthUrl => {
            this.spotifyAuthUrl = spotifyAuthUrl;
        });

        const isLoggedinResult = await this.ss.isLoggedIn();
        isLoggedinResult.assert(e => this.errors = [e]).cata(isLoggedIn => {
            this.isLoggedin = isLoggedIn;
        });

        const geniusTokenUrlResult = await this.ss.getGeniusAuthUrl();
        geniusTokenUrlResult.assert(e => this.errors = [e]).cata(geniusAuthUrl => {
            this.geniusAuthUrl = geniusAuthUrl;
        });

        const userInfoResult = await this.ss.profile();
        userInfoResult.assert(e => this.errors = [e]).cata(userInfo => {
            this.profile = userInfo;
        });

        const topTracksResult = await this.ss.listTopTracks();
        topTracksResult.assert(e => this.errors = [e]).cata(topTracks => {
            this.topTracks = _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index));
        });
    }

    async saveApiseedsKey(val: string) {
        const settingsResult = await this.ss.service(SettingsService);
        settingsResult.assert(e => this.errors = [e]).cata(settings => {
            settingsResult.val.apiseedsKey(val);
        });
    }

    async logout() {
        const res = await this.ss.logout();
        res.assert(e => this.errors = []).cata(() => {
            this.isLoggedin = false;
        });
    }
}

export { UserProfileViewModel };

