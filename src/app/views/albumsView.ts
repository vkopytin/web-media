import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/albums';
import { TrackViewModelItem } from '../viewModels';
import * as _ from 'underscore';
import { BehaviorSubject, merge, of, Subject, Subscription } from 'rxjs';
import { ViewModel } from '../base/viewModel';
import { Binding, current, State } from '../utils';
import { map, switchMap, takeUntil } from 'rxjs/operators';

export interface IAlbumsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsViewModel extends ViewModel<AlbumsViewModel['settings']> {
    errors$: BehaviorSubject<AlbumsViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: BehaviorSubject<AlbumsViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    settings = {};
}

class AlbumsView extends BaseView<IAlbumsViewProps, AlbumsView['state']> {
    vm = current(AlbumsViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();
    
    state = {
    };
    
    dispose$ = new Subject<void>();
    queue$: Subscription;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.queue$ = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
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

