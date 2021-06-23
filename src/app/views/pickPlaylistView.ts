import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import * as _ from 'underscore';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/pickPlaylist';
import { Binding, current } from '../utils';
import { HomeViewModel, PlaylistsViewModel, PlaylistsViewModelItem } from '../viewModels';


export interface IPickPlaylistsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PickPlaylistsView extends BaseView<IPickPlaylistsViewProps> {
    vm = current(PlaylistsViewModel);
    homeVm = current(HomeViewModel);

    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    playlists$ = this.vm.playlists$;
    @Binding playlists = this.playlists$.getValue();

    selectedPlaylist$ = this.homeVm.selectedPlaylist$;
    @Binding selectedPlaylist = this.selectedPlaylist$.getValue();

    dispose$ = new Subject<void>();
    disposeSubscription: Subscription;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.disposeSubscription = merge(
            this.playlists$.pipe(map(playlists => ({ playlists }))),
            this.selectedPlaylist$.pipe(map(selectedPlaylist => ({ selectedPlaylist }))),
            this.errors$.pipe(map(errors => ({ errors }))),
        ).pipe(takeUntil(this.dispose$)).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
    }

    componentDidUpdate(prevProps: IPickPlaylistsViewProps, prevState, snapshot) {
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PickPlaylistsView };

