import React from 'react';
import { IUserInfo } from '../ports/iMediaProt';
import { template } from '../templates/userProfile';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
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
    logoutCommand!: ICommand;

    @Binding((a: UserProfileView) => a.vm, 'updatApiseedsKeyCommand')
    updatApiseedsKeyCommand!: ICommand<string>;

    doLogout = false;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem): boolean {
        return this.currentTrackId === track.id();
    }

    showErrors(errors: Result[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

