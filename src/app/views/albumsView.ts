import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/albums';
import { Binding, current, Notifications } from '../utils';
import { AlbumsViewModel, TrackViewModelItem } from '../viewModels';

export interface IAlbumsViewProps {
    showErrors<T>(errors: ServiceResult<T, Error>[]): void;
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsView extends React.Component<IAlbumsViewProps> {
    didRefresh: AlbumsView['refresh'] = this.refresh.bind(this);
    vm = current(AlbumsViewModel);

    errors$ = this.vm.errors$;
    @Binding<AlbumsView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: AlbumsView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: AlbumsView['vm']['tracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding()
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

    refresh(args: { inst: AlbumsView['errors$']; value: ServiceResult<unknown, Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
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

    showErrors(errors: ServiceResult<unknown, Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { AlbumsView };

