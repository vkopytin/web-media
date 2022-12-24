import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/albums';
import { Binding, current, Notifications } from '../utils';
import { AlbumsViewModel, TrackViewModelItem } from '../viewModels';

export interface IAlbumsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsView extends React.Component<IAlbumsViewProps> {
    didRefresh: AlbumsView['refresh'] = this.refresh.bind(this);
    vm = current(AlbumsViewModel);

    errors$ = this.vm.errors$;
    @Binding({ didSet: (view, errors) => view.showErrors(errors) })
    errors: AlbumsView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks: AlbumsView['vm']['tracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding()
    selectedItem: AlbumsView['vm']['selectedItem'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: IAlbumsViewProps, prevState, snapshot) {
        this.tracks = this.props.tracks;
    }

    refresh(args) {
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { AlbumsView };

