import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/home';
import { Binding, current, Notify } from '../utils';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';

export interface IHomeViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class HomeView extends React.Component<IHomeViewProps> {
    didRefresh: HomeView['refresh'] = () => { };
    vm = current(HomeViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: HomeView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: HomeView['vm']['tracks'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likedTracks: HomeView['vm']['likedTracks'];

    isLoading$ = this.vm.isLoading$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isLoading: HomeView['vm']['isLoading'];

    selectedTrack$ = this.vm.selectedTrack$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectedTrack: HomeView['vm']['selectedTrack'];

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding({ didSet: (view) => view.didRefresh() })
    trackLyrics: HomeView['vm']['trackLyrics'];

    bannedTrackIds$ = this.vm.bannedTrackIds$;
    @Binding({ didSet: (view) => view.didRefresh() })
    bannedTrackIds: HomeView['vm']['bannedTrackIds'];

    refreshCommand$ = this.vm.refreshCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    refreshCommand: HomeView['vm']['refreshCommand'];

    selectTrackCommand$ = this.vm.selectTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectTrackCommand: HomeView['vm']['selectTrackCommand'];

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likeTrackCommand: HomeView['vm']['likeTrackCommand'];

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    unlikeTrackCommand: HomeView['vm']['unlikeTrackCommand'];

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    findTrackLyricsCommand: HomeView['vm']['findTrackLyricsCommand'];

    bannTrackCommand$ = this.vm.bannTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    bannTrackCommand: HomeView['vm']['bannTrackCommand'];

    removeBannFromTrackCommand$ = this.vm.removeBannFromTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    removeBannFromTrackCommand: HomeView['vm']['removeBannFromTrackCommand'];

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
    }

    refresh(args) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    isBanned(track: TrackViewModelItem) {
        const res = this.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { HomeView };

