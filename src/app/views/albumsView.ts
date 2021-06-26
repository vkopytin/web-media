import React from 'react';
import { BehaviorSubject, merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
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
    vm = current(AlbumsViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    selectedItem$ = this.vm.selectedItem$;
    @Binding selectedItem = this.selectedItem$.getValue();
    
    state = {
    };
    
    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    componentDidMount() {
        this.dispose$ = new Subject<void>();
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.selectedItem$.pipe(map(selectedItem => ({ selectedItem }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
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

    componentDidUpdate(prevProps: IAlbumsViewProps, prevState, snapshot) {
        this.tracks = this.props.tracks;
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

