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

    isInit = _.delay(() => {
        this.fetchData();
        this.apiseedsKey$.subscribe(_.debounce((val) => {
            this.saveApiseedsKey(val);
        }, 300));
    });

    constructor(private ss = current(Service)) {
        
    }

    async fetchData() {
        const settingsResult = await this.ss.service(SettingsService);
        if (!settingsResult.isError) {
            this.apiseedsKey = settingsResult.val.apiseedsKey();
        }
        const spotifyTokenUrlResult = await this.ss.getSpotifyAuthUrl();
        if (assertNoErrors(spotifyTokenUrlResult, e => this.errors = e)) {

            return;
        }
        const spotifyAuthUrl = spotifyTokenUrlResult.val as string;
        this.spotifyAuthUrl = spotifyAuthUrl;
        const geniusTokenUrlResult = await this.ss.getGeniusAuthUrl();
        if (assertNoErrors(geniusTokenUrlResult, e => this.errors = e)) {

            return;
        }
        const geniusAuthUrl = geniusTokenUrlResult.val as string;
        this.geniusAuthUrl = geniusAuthUrl;

        const userInfoResult = await this.ss.profile();

        if (assertNoErrors(userInfoResult, e => this.errors = e)) {
            return;
        }
        this.profile = userInfoResult.val;

        const topTracksResult = await this.ss.listTopTracks();
        if (assertNoErrors(topTracksResult, e => this.errors = e)) {
            return;
        }
        const topTracks = topTracksResult.val as IResponseResult<ITrack>;
        this.topTracks = _.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index));
    }

    async saveApiseedsKey(val: string) {
        const settingsResult = await this.ss.service(SettingsService);
        if (assertNoErrors(settingsResult, e => this.errors = e)) {
            return;
        }

        settingsResult.val.apiseedsKey(val);
    }
}

export { UserProfileViewModel };

