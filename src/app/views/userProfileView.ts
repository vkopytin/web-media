import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { template } from '../templates/userProfile';
import { Binding, current, Notifications } from '../utils';
import { Result } from '../utils/result';
import { AppViewModel, TrackViewModelItem, UserProfileViewModel } from '../viewModels';


export interface IUserProfileViewProps {
    className?: string;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class UserProfileView extends React.Component<IUserProfileViewProps> {
    didRefresh: UserProfileView['refresh'] = this.refresh.bind(this);
    vm = current(UserProfileViewModel);

    @Binding((a: UserProfileView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: UserProfileView['vm']['errors'];

    @Binding(() => current(AppViewModel), 'openLogin')
    openLogin!: boolean;

    @Binding((a: UserProfileView) => a.vm, 'isLoggedin')
    isLoggedin!: UserProfileView['vm']['isLoggedin'];

    @Binding((a: UserProfileView) => a.vm, 'profile')
    profile!: UserProfileView['vm']['profile'];

    @Binding((a: UserProfileView) => a.vm, 'currentTrackId')
    currentTrackId!: UserProfileView['vm']['currentTrackId'];

    @Binding((a: UserProfileView) => a.vm, 'topTracks')
    topTracks!: UserProfileView['vm']['topTracks'];

    @Binding((a: UserProfileView) => a.vm, 'tracks')
    tracks!: UserProfileView['vm']['tracks'];

    @Binding((a: UserProfileView) => a.vm, 'spotifyAuthUrl')
    spotifyAuthUrl!: UserProfileView['vm']['spotifyAuthUrl'];

    @Binding((a: UserProfileView) => a.vm, 'geniusAuthUrl')
    geniusAuthUrl!: UserProfileView['vm']['geniusAuthUrl'];

    @Binding((a: UserProfileView) => a.vm, 'apiseedsKey')
    apiseedsKey!: UserProfileView['vm']['apiseedsKey'];

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

    showErrors<T>(errors: Result[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

