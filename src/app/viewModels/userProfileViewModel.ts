import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IResponseResult, ITrack, IUserInfo } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { assertNoErrors, current, State } from '../utils';
import { TrackViewModelItem } from './trackViewModelItem';


class UserProfileViewModel {
    errors$: BehaviorSubject<UserProfileViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    isLoggedin$: BehaviorSubject<boolean>;
    @State isLoggedin = false;

    profile$: BehaviorSubject<UserProfileViewModel['profile']>;
    @State profile: IUserInfo = {};

    currentTrackId$: BehaviorSubject<UserProfileViewModel['currentTrackId']>;
    @State currentTrackId = '';

    topTracks$: BehaviorSubject<UserProfileViewModel['topTracks']>;
    @State topTracks = [] as TrackViewModelItem[];

    tracks$: BehaviorSubject<UserProfileViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    spotifyAuthUrl$: BehaviorSubject<UserProfileViewModel['spotifyAuthUrl']>;
    @State spotifyAuthUrl = '';

    geniusAuthUrl$: BehaviorSubject<UserProfileViewModel['geniusAuthUrl']>;
    @State geniusAuthUrl = '';

    apiseedsKey$: BehaviorSubject<UserProfileViewModel['apiseedsKey']>;
    @State apiseedsKey = '';

    logoutCommand$: BehaviorSubject<UserProfileViewModel['logoutCommand']>;
    @State logoutCommand = { exec: () => this.logout() };

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
        }, 300));
        resolve(true);
    }));

    constructor(private ss = current(Service)) {
        
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

