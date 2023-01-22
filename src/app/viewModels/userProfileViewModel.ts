import * as _ from 'underscore';
import { IUserInfo } from '../adapter/spotify';
import { Service } from '../service';
import { LoginService } from '../service/loginService';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { Binding, State } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


class UserProfileViewModel {
    @State errors: Result[] = [];
    @State isLoggedin = false;
    @State spotifyAuthUrl = '';
    @State geniusAuthUrl = '';
    @State apiseedsKey = '';
    @State profile: IUserInfo = {};
    @State topTracks: TrackViewModelItem[] = [];
    @State tracks: TrackViewModelItem[] = [];

    @State logoutCommand = Scheduler.Command(() => this.logout());
    @State updatApiseedsKeyCommand = Scheduler.Command((val: string) => {
        this.apiseedsKey = val;
        this.saveApiseedsKey(val);
    });

    @Binding(() => inject(AppViewModel), 'currentTrackId') currentTrackId = '';

    constructor(
        private appViewModel: AppViewModel,
        private login: LoginService,
        private settingsService: SettingsService,
        private spotify: SpotifyService,
        private app: Service
    ) {

    }

    async init() {
        await this.fetchData();
    }

    async fetchData() {
        this.apiseedsKey = this.settingsService.apiseedsKey();

        const spotifyTokenUrlResult = await this.login.getSpotifyAuthUrl();
        spotifyTokenUrlResult.map(spotifyAuthUrl => {
            this.spotifyAuthUrl = spotifyAuthUrl;
        }).error(e => this.errors = [Result.error(e)]);

        const isLoggedinResult = await this.app.isLoggedIn();
        isLoggedinResult.map(isLoggedIn => {
            this.isLoggedin = isLoggedIn;
        }).error(e => this.errors = [Result.error(e)]);

        const geniusTokenUrlResult = await this.login.getGeniusAuthUrl();
        geniusTokenUrlResult.map(geniusAuthUrl => {
            this.geniusAuthUrl = geniusAuthUrl;
        }).error(e => this.errors = [Result.error(e)]);

        const userInfoResult = await this.spotify.profile();
        userInfoResult.map(userInfo => {
            this.profile = userInfo;
        }).error(e => this.errors = [Result.error(e)]);

        const topTracksResult = await this.spotify.listTopTracks();
        topTracksResult.map(topTracks => {
            this.topTracks = _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index));
        }).error(e => this.errors = [Result.error(e)]);
    }

    saveApiseedsKey(val: string) {
        this.settingsService.apiseedsKey(val);
    }

    async logout() {
        const res = await this.spotify.logout();
        res.map(() => {
            this.isLoggedin = false;
        }).error(e => this.errors = [Result.error(e)]);
    }
}

export { UserProfileViewModel };

