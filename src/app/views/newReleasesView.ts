import React from 'react';
import * as _ from 'underscore';
import { template } from '../templates/newReleases';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AlbumViewModelItem, NewReleasesViewModel } from '../viewModels';


export interface INewReleasesViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    currentTrackId: string;
}

class NewReleasesView extends React.Component<INewReleasesViewProps> {
    didRefresh: NewReleasesView['refresh'] = this.refresh.bind(this);
    vm = inject(NewReleasesViewModel);

    @Binding((a: NewReleasesView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: NewReleasesView['vm']['errors'];

    @Binding((a: NewReleasesView) => a.vm, 'newReleases')
    newReleases!: NewReleasesView['vm']['newReleases'];

    @Binding((a: NewReleasesView) => a.vm, 'featuredPlaylists')
    featuredPlaylists!: NewReleasesView['vm']['featuredPlaylists'];

    @Binding((a: NewReleasesView) => a.vm, 'currentAlbum')
    currentAlbum!: NewReleasesView['vm']['currentAlbum'];

    @Binding((a: NewReleasesView) => a.vm, 'currentPlaylist')
    currentPlaylist!: NewReleasesView['vm']['currentPlaylist'];

    @Binding((a: NewReleasesView) => a.vm, 'tracks')
    tracks!: NewReleasesView['vm']['tracks'];

    @Binding((a: NewReleasesView) => a.vm, 'likedAlbums')
    likedAlbums!: NewReleasesView['vm']['likedAlbums'];

    @Binding((a: NewReleasesView) => a.vm, 'currentTracks')
    currentTracks!: NewReleasesView['vm']['currentTracks'];

    @Binding((a: NewReleasesView) => a.vm, 'selectAlbumCommand')
    selectAlbumCommand!: NewReleasesView['vm']['selectAlbumCommand'];

    @Binding((a: NewReleasesView) => a.vm, 'selectPlaylistCommand')
    selectPlaylistCommand!: NewReleasesView['vm']['selectPlaylistCommand'];

    @Binding((a: NewReleasesView) => a.vm, 'likeAlbumCommand')
    likeAlbumCommand!: NewReleasesView['vm']['likeAlbumCommand'];

    @Binding((a: NewReleasesView) => a.vm, 'unlikeAlbumCommand')
    unlikeAlbumCommand!: NewReleasesView['vm']['unlikeAlbumCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    isLiked(album: AlbumViewModelItem) {
        return !!_.find(this.likedAlbums, (item: AlbumViewModelItem) => item.id() === album.id());
    }

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { NewReleasesView };

