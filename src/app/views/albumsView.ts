import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/albums';
import { Binding, current, Notify, State, ValueContainer } from '../utils';
import { AlbumsViewModel, TrackViewModelItem } from '../viewModels';

export interface IAlbumsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsView extends React.Component<IAlbumsViewProps> {
    didRefresh: AlbumsView['refresh'] = () => {};
    vm = current(AlbumsViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: AlbumsView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: AlbumsView['vm']['tracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectedItem: AlbumsView['vm']['selectedItem'];

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
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

