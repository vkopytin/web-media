import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/userProfile';
import { Binding, current, Notifications } from '../utils';
import { AppViewModel, TrackViewModelItem, UserProfileViewModel } from '../viewModels';


export interface IUserProfileViewProps {
    className?: string;
    showErrors<T>(errors: ServiceResult<T, Error>[]): void;
    openLogin$: BehaviorSubject<boolean>;
}

class UserProfileView extends React.Component<IUserProfileViewProps> {
    didRefresh: UserProfileView['refresh'] = this.refresh.bind(this);
    vm = current(UserProfileViewModel);

    errors$ = this.vm.errors$;
    @Binding<UserProfileView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: UserProfileView['vm']['errors'];

    openLogin$ = this.props.openLogin$;
    @Binding()
    openLogin!: boolean;

    isLoggedin$ = this.vm.isLoggedin$;
    @Binding()
    isLoggedin!: UserProfileView['vm']['isLoggedin'];

    profile$ = this.vm.profile$;
    @Binding()
    profile!: UserProfileView['vm']['profile'];

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding()
    currentTrackId!: UserProfileView['vm']['currentTrackId'];

    topTracks$ = this.vm.topTracks$;
    @Binding()
    topTracks!: UserProfileView['vm']['topTracks'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: UserProfileView['vm']['tracks'];

    spotifyAuthUrl$ = this.vm.spotifyAuthUrl$;
    @Binding()
    spotifyAuthUrl!: UserProfileView['vm']['spotifyAuthUrl'];

    geniusAuthUrl$ = this.vm.geniusAuthUrl$;
    @Binding()
    geniusAuthUrl!: UserProfileView['vm']['geniusAuthUrl'];

    apiseedsKey$ = this.vm.apiseedsKey$;
    @Binding()
    apiseedsKey!: UserProfileView['vm']['apiseedsKey'];

    logoutCommand$ = this.vm.logoutCommand$;
    @Binding()
    logoutCommand!: UserProfileView['vm']['logoutCommand'];

    updatApiseedsKeyCommand$ = this.vm.updatApiseedsKeyCommand$;
    @Binding()
    updatApiseedsKeyCommand!: UserProfileView['vm']['updatApiseedsKeyCommand'];

    doLogout = false;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args: { inst: unknown; value: ServiceResult<unknown, Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return this.currentTrackId === track.id();
    }

    showErrors<T>(errors: ServiceResult<T, Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

