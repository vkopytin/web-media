import React from 'react';
import { template } from '../templates/pickPlaylist';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { HomeViewModel, PlaylistsViewModel, PlaylistsViewModelItem } from '../viewModels';


export interface IPickPlaylistsViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class PickPlaylistsView extends React.Component<IPickPlaylistsViewProps> {
    didRefresh: PickPlaylistsView['refresh'] = this.refresh.bind(this);
    vm = inject(PlaylistsViewModel);
    homeVm = inject(HomeViewModel);

    @Binding((a: PickPlaylistsView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: Result[];

    @Binding((a: PickPlaylistsView) => a.homeVm, 'selectedPlaylist')
    selectedPlaylist!: PlaylistsViewModelItem | null;

    @Binding((a: PickPlaylistsView) => a.vm, 'playlists')
    playlists!: PlaylistsViewModelItem[];

    @Binding((a: PickPlaylistsView) => a.homeVm, 'selectPlaylistCommand')
    selectPlaylistCommand!: PickPlaylistsView['homeVm']['selectPlaylistCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        //this.didRefresh = () => { };
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PickPlaylistsView };
