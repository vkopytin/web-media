import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/userProfile';
import { current } from '../utils';
import { TrackViewModelItem, UserProfileViewModel } from '../viewModels';
import { IUserInfo } from '../adapter/spotify';


export interface IUserProfileViewProps {
    className?: string;
    showErrors(errors: ServiceResult<any, Error>[]);
    openLogin(open): void
}

class UserProfileView extends BaseView<IUserProfileViewProps, UserProfileView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        tracks: [] as TrackViewModelItem[],
        profile: {} as IUserInfo,
        topTracks: [] as TrackViewModelItem[],
        refreshTokenUrl: '',
        currentTrackId: ''
    };

    binding = bindTo(this, () => current(UserProfileViewModel), {
        'prop(tracks)': 'tracks',
        'prop(profile)': 'profile',
        'prop(currentTrackId)': 'currentTrackId',
        'prop(topTracks)': 'topTracks',
        'prop(refreshTokenUrl)': 'prop(refreshTokenUrl)'
    });

    constructor(props) {
        super(props);
        subscribeToChange(this.binding, () => {
            this.setState({
                ...this.state
            });
        });
    }

    componentDidMount() {
        updateLayout(this.binding);
    }

    componentWillUnmount() {
        unbindFrom(this.binding);
    }

    isPlaying(track: TrackViewModelItem) {
        return this.prop('currentTrackId') === track.id();
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.prop('errors')) {
            this.prop('errors', val);
            this.props.showErrors(val);
        }

        return this.prop('errors');
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

