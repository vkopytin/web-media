import * as _ from 'underscore';
import { IResponseResult, ITrack, IUserInfo } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, current } from '../utils';
import { TrackViewModelItem } from './trackViewModelItem';


class UserProfileViewModel extends ViewModel<UserProfileViewModel['settings']> {

    settings = {
        ...(this as any as ViewModel).settings,
        currentTrackId: '',
        topTracks: [] as TrackViewModelItem[],
        refreshTokenUrl: '',
        autoRefreshUrl: ''
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

    async fetchData() {
        const tokenUrlResult = await this.ss.getRefreshTokenUrl();
        if (assertNoErrors(tokenUrlResult, e => this.errors(e))) {

            return;
        }
        const refreshTokenUrl = tokenUrlResult.val as string;
        this.prop('refreshTokenUrl', refreshTokenUrl);

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

}

export { UserProfileViewModel };

