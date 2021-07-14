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
        settingsResult.assert(e => this.errors = [e]).map(() => {
            this.apiseedsKey = settingsResult.val.apiseedsKey();
        });
        const spotifyTokenUrlResult = await this.ss.getSpotifyAuthUrl();
        spotifyTokenUrlResult.assert(e => this.errors = [e]).map(spotifyAuthUrl => {
            this.spotifyAuthUrl = spotifyAuthUrl;
        });

        const geniusTokenUrlResult = await this.ss.getGeniusAuthUrl();
        geniusTokenUrlResult.assert(e => this.errors = [e]).map(geniusAuthUrl => {
            this.geniusAuthUrl = geniusAuthUrl;
        });

        const userInfoResult = await this.ss.profile();
        userInfoResult.assert(e => this.errors = [e]).map(userInfo => {
            this.profile = userInfo;
        });

        const topTracksResult = await this.ss.listTopTracks();
        topTracksResult.assert(e => this.errors = [e]).map(topTracks => {
            this.topTracks = _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index));
        });
    }

    async saveApiseedsKey(val: string) {
        const settingsResult = await this.ss.service(SettingsService);
        settingsResult.assert(e => this.errors = [e]).map(settings => {
            settingsResult.val.apiseedsKey(val);
        });
    }
}

export { UserProfileViewModel };

