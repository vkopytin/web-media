import React from 'react';
import { template } from '../templates/albums';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AlbumsViewModel, TrackViewModelItem } from '../viewModels';

export interface IAlbumsViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsView extends React.Component<IAlbumsViewProps> {
    didRefresh: AlbumsView['refresh'] = this.refresh.bind(this);
    vm = inject(AlbumsViewModel);

    @Binding((a: AlbumsView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: Result;

    @Binding((a: AlbumsView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: AlbumsView) => a.vm, 'selectedItem')
    selectedItem!: TrackViewModelItem | null;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: IAlbumsViewProps) {
        this.tracks = this.props.tracks;
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    uri() {
        return this.props.uri;
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

export { AlbumsView };

