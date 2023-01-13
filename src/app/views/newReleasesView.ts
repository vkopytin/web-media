import React from 'react';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/newReleases';
import { Binding, current, Notifications } from '../utils';
import { AlbumViewModelItem, NewReleasesViewModel } from '../viewModels';


export interface INewReleasesViewProps {
    showErrors<T>(errors: ServiceResult<T, Error>[]): void;
    currentTrackId: string;
}

class NewReleasesView extends React.Component<INewReleasesViewProps> {
    didRefresh: NewReleasesView['refresh'] = this.refresh.bind(this);
    vm = current(NewReleasesViewModel);

    errors$ = this.vm.errors$;
    @Binding<NewReleasesView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: NewReleasesView['vm']['errors'];

    newReleases$ = this.vm.newReleases$;
    @Binding()
    newReleases!: NewReleasesView['vm']['newReleases'];

    featuredPlaylists$ = this.vm.featuredPlaylists$;
    @Binding()
    featuredPlaylists!: NewReleasesView['vm']['featuredPlaylists'];

    currentAlbum$ = this.vm.currentAlbum$;
    @Binding()
    currentAlbum!: NewReleasesView['vm']['currentAlbum'];

    currentPlaylist$ = this.vm.currentPlaylist$;
    @Binding()
    currentPlaylist!: NewReleasesView['vm']['currentPlaylist'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: NewReleasesView['vm']['tracks'];

    likedAlbums$ = this.vm.likedAlbums$;
    @Binding()
    likedAlbums!: NewReleasesView['vm']['likedAlbums'];

    currentTracks$ = this.vm.currentTracks$;
    @Binding()
    currentTracks!: NewReleasesView['vm']['currentTracks'];

    selectAlbumCommand$ = this.vm.selectAlbumCommand$;
    @Binding()
    selectAlbumCommand!: NewReleasesView['vm']['selectAlbumCommand'];

    selectPlaylistCommand$ = this.vm.selectPlaylistCommand$;
    @Binding()
    selectPlaylistCommand!: NewReleasesView['vm']['selectPlaylistCommand'];

    likeAlbumCommand$ = this.vm.likeAlbumCommand$;
    @Binding()
    likeAlbumCommand!: NewReleasesView['vm']['likeAlbumCommand'];

    unlikeAlbumCommand$ = this.vm.unlikeAlbumCommand$;
    @Binding()
    unlikeAlbumCommand!: NewReleasesView['vm']['unlikeAlbumCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args: { inst: unknown; value: ServiceResult<unknown, Error>[]; }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    isLiked(album: AlbumViewModelItem) {
        return !!_.find(this.likedAlbums, (item: AlbumViewModelItem) => item.id() === album.id());
    }

    showErrors(errors: ServiceResult<unknown, Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { NewReleasesView };

