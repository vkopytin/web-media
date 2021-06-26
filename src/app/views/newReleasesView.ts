import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/newReleases';
import { Binding, current } from '../utils';
import { AlbumViewModelItem, NewReleasesViewModel } from '../viewModels';


export interface INewReleasesViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    currentTrackId: string;
}

class NewReleasesView extends React.Component<INewReleasesViewProps> {
    vm = current(NewReleasesViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    newReleases$ = this.vm.newReleases$;
    @Binding newReleases = this.newReleases$.getValue();

    currentAlbum$ = this.vm.currentAlbum$;
    @Binding currentAlbum = this.vm.currentAlbum$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    likedAlbums$ = this.vm.likedAlbums$;
    @Binding likedAlbums = this.likedAlbums$.getValue();

    selectAlbumCommand$ = this.vm.selectAlbumCommand$;
    @Binding selectAlbumCommand = this.selectAlbumCommand$.getValue();

    likeAlbumCommand$ = this.vm.likeAlbumCommand$;
    @Binding likeAlbumCommand = this.likeAlbumCommand$.getValue();

    unlikeAlbumCommand$ = this.vm.unlikeAlbumCommand$;
    @Binding unlikeAlbumCommand = this.unlikeAlbumCommand$.getValue();

    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    componentDidMount() {
        this.dispose$ = new Subject<void>();
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.newReleases$.pipe(map(newReleases => ({ newReleases }))),
            this.currentAlbum$.pipe(map(currentAlbum => ({ currentAlbum }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.likedAlbums$.pipe(map(likedAlbums => ({ likedAlbums }))),
            this.selectAlbumCommand$.pipe(map(selectAlbumCommand => ({ selectAlbumCommand }))),
            this.likeAlbumCommand$.pipe(map(likeAlbumCommand => ({ likeAlbumCommand }))),
            this.unlikeAlbumCommand$.pipe(map(unlikeAlbumCommand => ({ unlikeAlbumCommand }))),
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

    isLiked(album: AlbumViewModelItem) {
        return !!_.find(this.likedAlbums, (item: AlbumViewModelItem) => item.id() === album.id());
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { NewReleasesView };

