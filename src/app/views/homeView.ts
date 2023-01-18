import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/home';
import { Binding, current, Notifications } from '../utils';
import { Result } from '../utils/result';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';

export interface IHomeViewProps {
    currentTrackId: string;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class HomeView extends React.Component<IHomeViewProps> {
    didRefresh: HomeView['refresh'] = this.refresh.bind(this);
    vm = current(HomeViewModel);

    errors$ = this.vm.errors$;
    @Binding<HomeView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: HomeView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: HomeView['vm']['tracks'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding()
    likedTracks!: HomeView['vm']['likedTracks'];

    isLoading$ = this.vm.isLoading$;
    @Binding()
    isLoading!: HomeView['vm']['isLoading'];

    selectedTrack$ = this.vm.selectedTrack$;
    @Binding()
    selectedTrack!: HomeView['vm']['selectedTrack'];

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding()
    trackLyrics!: HomeView['vm']['trackLyrics'];

    bannedTrackIds$ = this.vm.bannedTrackIds$;
    @Binding()
    bannedTrackIds!: HomeView['vm']['bannedTrackIds'];

    refreshCommand$ = this.vm.refreshCommand$;
    @Binding()
    refreshCommand!: HomeView['vm']['refreshCommand'];

    selectTrackCommand$ = this.vm.selectTrackCommand$;
    @Binding()
    selectTrackCommand!: HomeView['vm']['selectTrackCommand'];

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding()
    likeTrackCommand!: HomeView['vm']['likeTrackCommand'];

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding()
    unlikeTrackCommand!: HomeView['vm']['unlikeTrackCommand'];

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding()
    findTrackLyricsCommand!: HomeView['vm']['findTrackLyricsCommand'];

    bannTrackCommand$ = this.vm.bannTrackCommand$;
    @Binding()
    bannTrackCommand!: HomeView['vm']['bannTrackCommand'];

    removeBannFromTrackCommand$ = this.vm.removeBannFromTrackCommand$;
    @Binding()
    removeBannFromTrackCommand!: HomeView['vm']['removeBannFromTrackCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args: { inst: HomeView['errors$']; value: Result<Error>[] }) {
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

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { HomeView };

