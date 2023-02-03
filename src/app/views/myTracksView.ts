import React from 'react';
import { template } from '../templates/myTracks';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';

export interface IMyTracksViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends React.Component<IMyTracksViewProps> {
    didRefresh: MyTracksView['refresh'] = this.refresh.bind(this);
    vm = inject(MyTracksViewModel);

    @Binding((a: MyTracksView) => a.vm, 'errors')
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
    loadMoreCommand!: ICommand;

    @Binding((a: MyTracksView) => a.vm, 'findTrackLyricsCommand')
    findTrackLyricsCommand!: ICommand<TrackViewModelItem>;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate() {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem): boolean {
        return this.props.currentTrackId === track.id();
    }

    showErrors(errors: Result<Error>[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { MyTracksView };

