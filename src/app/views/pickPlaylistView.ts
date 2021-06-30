import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/pickPlaylist';
import { Binding, current } from '../utils';
import { HomeViewModel, PlaylistsViewModel } from '../viewModels';


export interface IPickPlaylistsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PickPlaylistsView extends React.Component<IPickPlaylistsViewProps> {
    didRefresh: PickPlaylistsView['refresh'] = () => { };
    vm = current(PlaylistsViewModel);
    homeVm = current(HomeViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: PickPlaylistsView['vm']['errors'];

    playlists$ = this.vm.playlists$;
    @Binding({ didSet: (view) => view.didRefresh() })
    playlists: PickPlaylistsView['vm']['playlists'];

    selectedPlaylist$ = this.homeVm.selectedPlaylist$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectedPlaylist: PickPlaylistsView['homeVm']['selectedPlaylist'];

    componentDidMount() {
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        this.didRefresh = () => { };
    }

    componentDidUpdate(prevProps: IPickPlaylistsViewProps, prevState, snapshot) {
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PickPlaylistsView };

