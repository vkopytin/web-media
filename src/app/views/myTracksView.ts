import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/myTracks';
import { Binding, current, Notifications } from '../utils';
import { Result } from '../utils/result';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';

export interface IMyTracksViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends React.Component<IMyTracksViewProps> {
    didRefresh: MyTracksView['refresh'] = this.refresh.bind(this);
    vm = current(MyTracksViewModel);

    errors$ = this.vm.errors$;
    @Binding<MyTracksView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: MyTracksView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: MyTracksView['vm']['tracks'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding()
    likedTracks!: MyTracksView['vm']['likedTracks'];

    isLoading$ = this.vm.isLoading$;
    @Binding()
    isLoading!: MyTracksView['vm']['isLoading'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding()
    selectedItem!: MyTracksView['vm']['selectedItem'];

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding()
    trackLyrics!: MyTracksView['vm']['trackLyrics'];

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding()
    loadMoreCommand!: MyTracksView['vm']['loadMoreCommand'];

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding()
    findTrackLyricsCommand!: MyTracksView['vm']['findTrackLyricsCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: IMyTracksViewProps) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh(args: { inst: unknown; value: Result<Error>[] }) {
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

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { MyTracksView };

