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
    vm = current(PlaylistsViewModel);
    homeVm = current(HomeViewModel);

    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    playlists$ = this.vm.playlists$;
    @Binding playlists = this.playlists$.getValue();

    selectedPlaylist$ = this.homeVm.selectedPlaylist$;
    @Binding selectedPlaylist = this.selectedPlaylist$.getValue();

    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    componentDidMount() {
        this.dispose$ = new Subject<void>();
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
        this.errors$.pipe(
            takeUntil(this.dispose$),
            map(errors => this.showErrors(errors))
        ).subscribe();
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

