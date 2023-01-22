import React from 'react';
import { IUserInfo } from '../adapter/spotify';
import { template } from '../templates/userProfile';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AppViewModel, TrackViewModelItem, UserProfileViewModel } from '../viewModels';


export interface IUserProfileViewProps {
    className?: string;
    showErrors(errors: Result[]): void;
}

class UserProfileView extends React.Component<IUserProfileViewProps> {
    didRefresh: UserProfileView['refresh'] = this.refresh.bind(this);
    vm = inject(UserProfileViewModel);

    @Binding((a: UserProfileView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: Result[];

    @Binding(() => inject(AppViewModel), 'openLogin')
    openLogin!: boolean;

    @Binding((a: UserProfileView) => a.vm, 'isLoggedin')
    isLoggedin!: boolean;

    @Binding((a: UserProfileView) => a.vm, 'profile')
    profile!: IUserInfo;

    @Binding((a: UserProfileView) => a.vm, 'currentTrackId')
    currentTrackId!: string;

    @Binding((a: UserProfileView) => a.vm, 'spotifyAuthUrl')
    spotifyAuthUrl!: string;

    @Binding((a: UserProfileView) => a.vm, 'geniusAuthUrl')
    geniusAuthUrl!: string;

    @Binding((a: UserProfileView) => a.vm, 'apiseedsKey')
    apiseedsKey!: string;

    @Binding((a: UserProfileView) => a.vm, 'topTracks')
    topTracks!: TrackViewModelItem[];

    @Binding((a: UserProfileView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: UserProfileView) => a.vm, 'logoutCommand')
    logoutCommand!: UserProfileView['vm']['logoutCommand'];

    @Binding((a: UserProfileView) => a.vm, 'updatApiseedsKeyCommand')
    updatApiseedsKeyCommand!: UserProfileView['vm']['updatApiseedsKeyCommand'];

    doLogout = false;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return this.currentTrackId === track.id();
    }

    showErrors(errors: Result[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

