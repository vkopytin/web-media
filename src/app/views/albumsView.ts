import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/albums';
import { Binding, current, Notifications, StateV2 } from '../utils';
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
    vm = current(AlbumsViewModel);

    @Binding((a: AlbumsView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: AlbumsView['vm']['errors'];

    @Binding((a: AlbumsView) => a.vm, 'tracks')
    tracks!: AlbumsView['vm']['tracks'];

    @Binding((a: AlbumsView) => a.vm, 'selectedItem')
    selectedItem!: AlbumsView['vm']['selectedItem'];

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

