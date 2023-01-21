import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IUserInfo } from '../adapter/spotify';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { Binding, current, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


class UserProfileViewModel {
    @State errors = [] as Result<Error, unknown>[];
    @State isLoggedin = false;
    @State profile: IUserInfo = {};
    @State topTracks = [] as TrackViewModelItem[];
    @State tracks = [] as TrackViewModelItem[];
    @State spotifyAuthUrl = '';
    @State geniusAuthUrl = '';
    @State apiseedsKey = '';
    @State logoutCommand = Scheduler.Command(() => this.logout());
    @State updatApiseedsKeyCommand = Scheduler.Command((val: string) => {
        this.apiseedsKey = val;
        this.saveApiseedsKey(val);
    });

    @Binding(() => current(AppViewModel), 'currentTrackId') currentTrackId = '';

    constructor(
        private appViewModel: AppViewModel,
        private settingsService: SettingsService,
        private ss: Service
    ) {

    }

    async init() {
        await this.fetchData();
    }

    async fetchData() {
        this.apiseedsKey = this.settingsService.apiseedsKey();

        const spotifyTokenUrlResult = await this.ss.getSpotifyAuthUrl();
        spotifyTokenUrlResult.map(spotifyAuthUrl => {
            this.spotifyAuthUrl = spotifyAuthUrl;
        }).error(e => this.errors = [Result.error(e)]);

        const isLoggedinResult = await this.ss.isLoggedIn();
        isLoggedinResult.map(isLoggedIn => {
            this.isLoggedin = isLoggedIn;
        }).error(e => this.errors = [Result.error(e)]);

        const geniusTokenUrlResult = await this.ss.getGeniusAuthUrl();
        geniusTokenUrlResult.map(geniusAuthUrl => {
            this.geniusAuthUrl = geniusAuthUrl;
        }).error(e => this.errors = [Result.error(e)]);

        const userInfoResult = await this.ss.profile();
        userInfoResult.map(userInfo => {
            this.profile = userInfo;
        }).error(e => this.errors = [Result.error(e)]);

        const topTracksResult = await this.ss.listTopTracks();
        topTracksResult.map(topTracks => {
            this.topTracks = _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index));
        }).error(e => this.errors = [Result.error(e)]);
    }

    saveApiseedsKey(val: string) {
        this.settingsService.apiseedsKey(val);
    }

    async logout() {
        const res = await this.ss.logout();
        res.map(() => {
            this.isLoggedin = false;
        }).error(e => this.errors = [Result.error(e)]);
    }
}

export { UserProfileViewModel };

