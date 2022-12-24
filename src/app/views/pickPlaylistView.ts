import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/pickPlaylist';
import { Binding, current, Notifications } from '../utils';
import { HomeViewModel, PlaylistsViewModel } from '../viewModels';


export interface IPickPlaylistsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PickPlaylistsView extends React.Component<IPickPlaylistsViewProps> {
    didRefresh: PickPlaylistsView['refresh'] = this.refresh.bind(this);
    vm = current(PlaylistsViewModel);
    homeVm = current(HomeViewModel);

    errors$ = this.vm.errors$;
    @Binding({ didSet: (view, errors) => view.showErrors(errors) })
    errors: PickPlaylistsView['vm']['errors'];

    playlists$ = this.vm.playlists$;
    @Binding()
    playlists: PickPlaylistsView['vm']['playlists'];

    selectedPlaylist$ = this.homeVm.selectedPlaylist$;
    @Binding()
    selectedPlaylist: PickPlaylistsView['homeVm']['selectedPlaylist'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        //this.didRefresh = () => { };
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: IPickPlaylistsViewProps, prevState, snapshot) {
    }

    refresh(args) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
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

