import * as _ from 'underscore';
import { IResponseResult, ITrack, IUserInfo } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, current } from '../utils';
import { TrackViewModelItem } from './trackViewModelItem';
import { SettingsService } from '../service/settings';


class UserProfileViewModel extends ViewModel<UserProfileViewModel['settings']> {

    settings = {
        ...(this as any as ViewModel).settings,
        currentTrackId: '',
        topTracks: [] as TrackViewModelItem[],
        spotifyAuthUrl: '',
        geniusAuthUrl: '',
        musixmatchKey: ''
    };

    userInfo = {} as IUserInfo;

    isInit = _.delay(() => {
        this.fetchData();
    });

    constructor(private ss = current(Service)) {
        super();
    }

    profile(val?) {
        if (arguments.length && this.userInfo !== val) {
            this.userInfo = val;
            this.trigger('change:profile');
        }

        return this.userInfo;
    }

    currentTrackId(val?) {
        if (arguments.length && val !== this.settings.currentTrackId) {
            this.settings.currentTrackId = val;
            this.trigger('change:currentTrackId');
        }

        return this.settings.currentTrackId;
    }

    topTracks(val?) {
        if (arguments.length && val !== this.settings.topTracks) {
            this.settings.topTracks = val;
            this.trigger('change:topTracks');
        }

        return this.settings.topTracks;
    }

    musixmatchKey(val?: string) {
        if (arguments.length && val !== this.settings.musixmatchKey) {
            this.settings.musixmatchKey = val;
            this.trigger('change:musixmatchKey');
            this.saveMusixmatchKey(val);
        }

        return this.settings.musixmatchKey;
    }

    async fetchData() {
        const settingsResult = await this.ss.service(SettingsService);
        if (!settingsResult.isError) {
            this.musixmatchKey(settingsResult.val.musixmatchKey());
        }
        const spotifyTokenUrlResult = await this.ss.getSpotifyAuthUrl();
        if (assertNoErrors(spotifyTokenUrlResult, e => this.errors(e))) {

            return;
        }
        const spotifyAuthUrl = spotifyTokenUrlResult.val as string;
        this.prop('spotifyAuthUrl', spotifyAuthUrl);
        const geniusTokenUrlResult = await this.ss.getGeniusAuthUrl();
        if (assertNoErrors(geniusTokenUrlResult, e => this.errors(e))) {

            return;
        }
        const geniusAuthUrl = geniusTokenUrlResult.val as string;
        this.prop('geniusAuthUrl', geniusAuthUrl);

        const userInfoResult = await this.ss.profile();

        if (assertNoErrors(userInfoResult, e => this.errors(e))) {
            return;
        }
        this.profile(userInfoResult.val);

        const topTracksResult = await this.ss.listTopTracks();
        if (assertNoErrors(topTracksResult, e => this.errors(e))) {
            return;
        }
        const topTracks = topTracksResult.val as IResponseResult<ITrack>;
        this.topTracks(_.map(topTracks.items, (track, index) => new TrackViewModelItem({ track } as any, index)));
    }

    async saveMusixmatchKey(val: string) {
        const settingsResult = await this.ss.service(SettingsService);
        if (assertNoErrors(settingsResult, e => this.errors(e))) {
            return;
        }

        settingsResult.val.musixmatchKey(val);
    }
}

export { UserProfileViewModel };

