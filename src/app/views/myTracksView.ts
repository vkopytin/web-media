import React from 'react';
import { template } from '../templates/myTracks';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';

export interface IMyTracksViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends React.Component<IMyTracksViewProps> {
    didRefresh: MyTracksView['refresh'] = this.refresh.bind(this);
    vm = inject(MyTracksViewModel);

    @Binding((a: MyTracksView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: Result[];

    @Binding((a: MyTracksView) => a.vm, 'isLoading')
    isLoading!: boolean;

    @Binding((a: MyTracksView) => a.vm, 'selectedItem')
    selectedItem!: TrackViewModelItem | null;

    @Binding((a: MyTracksView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: MyTracksView) => a.vm, 'likedTracks')
    likedTracks!: TrackViewModelItem[];

    @Binding((a: MyTracksView) => a.vm, 'trackLyrics')
    trackLyrics!: MyTracksView['vm']['trackLyrics'];

    @Binding((a: MyTracksView) => a.vm, 'loadMoreCommand')
    loadMoreCommand!: MyTracksView['vm']['loadMoreCommand'];

    @Binding((a: MyTracksView) => a.vm, 'findTrackLyricsCommand')
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

    refresh() {
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

