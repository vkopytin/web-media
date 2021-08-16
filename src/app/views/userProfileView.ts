import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/userProfile';
import { current } from '../utils';
import { TrackViewModelItem, UserProfileViewModel } from '../viewModels';
import { IUserInfo } from '../adapter/spotify';
import { BehaviorSubject, merge, of, Subject, Subscription } from 'rxjs';
import { Binding } from '../utils';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import React from 'react';


export interface IUserProfileViewProps {
    className?: string;
    showErrors(errors: ServiceResult<any, Error>[]);
    openLogin$: BehaviorSubject<boolean>;
}

class UserProfileView extends React.Component<IUserProfileViewProps> {
    didRefresh: UserProfileView['refresh'] = () => { };
    vm = current(UserProfileViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: UserProfileView['vm']['errors'];

    openLogin$ = this.props.openLogin$;
    @Binding({ didSet: (view) => view.didRefresh() })
    openLogin: boolean;

    isLoggedin$ = this.vm.isLoggedin$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isLoggedin: UserProfileView['vm']['isLoggedin'];

    profile$ = this.vm.profile$;
    @Binding({ didSet: (view) => view.didRefresh() })
    profile: UserProfileView['vm']['profile'];

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentTrackId: UserProfileView['vm']['currentTrackId'];

    topTracks$ = this.vm.topTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    topTracks: UserProfileView['vm']['topTracks'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: UserProfileView['vm']['tracks'];

    spotifyAuthUrl$ = this.vm.spotifyAuthUrl$;
    @Binding({ didSet: (view) => view.didRefresh() })
    spotifyAuthUrl: UserProfileView['vm']['spotifyAuthUrl'];

    geniusAuthUrl$ = this.vm.geniusAuthUrl$;
    @Binding({ didSet: (view) => view.didRefresh() })
    geniusAuthUrl: UserProfileView['vm']['geniusAuthUrl'];

    apiseedsKey$ = this.vm.apiseedsKey$;
    @Binding({ didSet: (view) => view.didRefresh() })
    apiseedsKey: UserProfileView['vm']['apiseedsKey'];

    logoutCommand$ = this.vm.logoutCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    logoutCommand: UserProfileView['vm']['logoutCommand'];

    doLogout = false;
  
    componentDidMount() {
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        this.didRefresh = () => { };
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return this.currentTrackId === track.id();
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

