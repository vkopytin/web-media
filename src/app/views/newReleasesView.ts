import React from 'react';
import * as _ from 'underscore';
import { template } from '../templates/newReleases';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { AlbumViewModelItem, NewReleasesViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


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
    errors!: Result[];

    @Binding((a: NewReleasesView) => a.vm, 'newReleases')
    newReleases!: AlbumViewModelItem[];

    @Binding((a: NewReleasesView) => a.vm, 'featuredPlaylists')
    featuredPlaylists!: PlaylistsViewModelItem[];

    @Binding((a: NewReleasesView) => a.vm, 'currentAlbum')
    currentAlbum!: AlbumViewModelItem | null;

    @Binding((a: NewReleasesView) => a.vm, 'currentPlaylist')
    currentPlaylist!: PlaylistsViewModelItem | null;

    @Binding((a: NewReleasesView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: NewReleasesView) => a.vm, 'likedAlbums')
    likedAlbums!: AlbumViewModelItem[];

    @Binding((a: NewReleasesView) => a.vm, 'currentTracks')
    currentTracks!: TrackViewModelItem[];

    @Binding((a: NewReleasesView) => a.vm, 'selectAlbumCommand')
    selectAlbumCommand!: ICommand<AlbumViewModelItem | null>;

    @Binding((a: NewReleasesView) => a.vm, 'selectPlaylistCommand')
    selectPlaylistCommand!: ICommand<PlaylistsViewModelItem | null>;

    @Binding((a: NewReleasesView) => a.vm, 'likeAlbumCommand')
    likeAlbumCommand!: ICommand<AlbumViewModelItem>;

    @Binding((a: NewReleasesView) => a.vm, 'unlikeAlbumCommand')
    unlikeAlbumCommand!: ICommand<AlbumViewModelItem>;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    isLiked(album: AlbumViewModelItem): boolean {
        return !!_.find(this.likedAlbums, (item: AlbumViewModelItem) => item.id() === album.id());
    }

    showErrors(errors: Result<Error>[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { NewReleasesView };

