import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IUserInfo } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { Binding, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


class UserProfileViewModel {
    errors$!: BehaviorSubject<UserProfileViewModel['errors']>;
    @State errors = [] as ServiceResult<{}, Error>[];

    isLoggedin$!: BehaviorSubject<boolean>;
    @State isLoggedin = false;

    profile$!: BehaviorSubject<UserProfileViewModel['profile']>;
    @State profile: IUserInfo = {};

    topTracks$!: BehaviorSubject<UserProfileViewModel['topTracks']>;
    @State topTracks = [] as TrackViewModelItem[];

    tracks$!: BehaviorSubject<UserProfileViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    spotifyAuthUrl$!: BehaviorSubject<UserProfileViewModel['spotifyAuthUrl']>;
    @State spotifyAuthUrl = '';

    geniusAuthUrl$!: BehaviorSubject<UserProfileViewModel['geniusAuthUrl']>;
    @State geniusAuthUrl = '';

    apiseedsKey$!: BehaviorSubject<UserProfileViewModel['apiseedsKey']>;
    @State apiseedsKey = '';

    logoutCommand$!: BehaviorSubject<UserProfileViewModel['logoutCommand']>;
    @State logoutCommand = Scheduler.Command(() => this.logout());

    currentTrackId$ = this.appViewModel.currentTrackId$;
    @Binding() currentTrackId = '';

    settings = {
        currentTrackId: '',
        spotifyAuthUrl: '',
        geniusAuthUrl: '',
        apiseedsKey: ''
    };

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.fetchData();
        this.apiseedsKey$.subscribe(_.debounce((val: string) => {
            this.saveApiseedsKey(val);
        }, 300));
        resolve(true);
    }));

    constructor(private appViewModel: AppViewModel, private ss: Service) {

    }

    async fetchData() {
        const settingsResult = await this.ss.service(SettingsService);
        settingsResult.assert(e => this.errors = [e]).cata(() => {
            this.apiseedsKey = settingsResult.cata(val => val.apiseedsKey());
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
            settingsResult.map(v => v.apiseedsKey(val));
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

