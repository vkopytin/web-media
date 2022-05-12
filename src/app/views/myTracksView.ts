import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/myTracks';
import { Binding, current, Notify } from '../utils';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';

export interface IMyTracksViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends React.Component<IMyTracksViewProps> {
    didRefresh: MyTracksView['refresh'] = () => { };
    vm = current(MyTracksViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: MyTracksView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: MyTracksView['vm']['tracks'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likedTracks: MyTracksView['vm']['likedTracks'];

    isLoading$ = this.vm.isLoading$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isLoading: MyTracksView['vm']['isLoading'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectedItem: MyTracksView['vm']['selectedItem'];

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding({ didSet: (view) => view.didRefresh() })
    trackLyrics: MyTracksView['vm']['trackLyrics'];

    state = {
        term: '',
    };

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    loadMoreCommand: MyTracksView['vm']['loadMoreCommand'];

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    findTrackLyricsCommand: MyTracksView['vm']['findTrackLyricsCommand'];

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
    }

    componentDidUpdate(prevProps: IMyTracksViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { MyTracksView };

