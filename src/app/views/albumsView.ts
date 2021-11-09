import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/albums';
import { Binding, current, State } from '../utils';
import { TrackViewModelItem } from '../viewModels';

export interface IAlbumsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsViewModel {
    errors$: BehaviorSubject<AlbumsViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: BehaviorSubject<AlbumsViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    selectedItem$: BehaviorSubject<AlbumsViewModel['selectedItem']>;
    @State selectedItem = null as TrackViewModelItem;
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
    
    state = {
    };

    componentDidMount() {
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        this.didRefresh = () => { };
    }

    componentDidUpdate(prevProps: IAlbumsViewProps, prevState, snapshot) {
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { AlbumsView };

