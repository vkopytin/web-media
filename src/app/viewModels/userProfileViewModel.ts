import * as _ from 'underscore';
import { AppService, LogService } from '../service';
import { LoginService } from '../service/loginService';
import { SettingsService } from '../service/settings';
import { MediaService } from '../service/mediaService';
import { Binding, State } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';
import { ISpotifySong, IUserInfo } from '../ports/iMediaProt';


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

    @Binding((v: UserProfileViewModel) => v.appViewModel, 'currentTrackId')
    currentTrackId!: string;

    constructor(
        private logService: LogService,
        private appViewModel: AppViewModel,
        private login: LoginService,
        private settingsService: SettingsService,
        private media: MediaService,
        private app: AppService
    ) {

    }

    async init(): Promise<void> {
        await this.fetchData();
    }

    async fetchData(): Promise<void> {
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

        const userInfoResult = await this.media.profile();
        userInfoResult.map(userInfo => {
            this.profile = userInfo;
        }).error(e => this.errors = [Result.error(e)]);

        const topTracksResult = await this.media.listTopTracks();
        topTracksResult.map(topTracks => {
            this.topTracks = _.map(topTracks.items, (track, index) => TrackViewModelItem.fromTrack(track, index));
        }).error(e => this.errors = [Result.error(e)]);
    }

    saveApiseedsKey(val: string): void {
        this.settingsService.apiseedsKey(val);
    }

    async logout(): Promise<void> {
        const res = await this.media.logout();
        res.map(() => {
            this.isLoggedin = false;
        }).error(e => this.errors = [Result.error(e)]);
    }
}

export { UserProfileViewModel };

