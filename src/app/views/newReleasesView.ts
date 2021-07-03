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
    didRefresh: NewReleasesView['refresh'] = () => { };
    vm = current(NewReleasesViewModel);
    
    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: NewReleasesView['vm']['errors'];

    newReleases$ = this.vm.newReleases$;
    @Binding({ didSet: (view) => view.didRefresh() })
    newReleases: NewReleasesView['vm']['newReleases'];

    featuredPlaylists$ = this.vm.featuredPlaylists$;
    @Binding({ didSet: (view => view.didRefresh()) })
    featuredPlaylists: NewReleasesView['vm']['featuredPlaylists'];

    currentAlbum$ = this.vm.currentAlbum$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentAlbum: NewReleasesView['vm']['currentAlbum'];

    currentPlaylist$ = this.vm.currentPlaylist$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentPlaylist: NewReleasesView['vm']['currentPlaylist'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: NewReleasesView['vm']['tracks'];

    likedAlbums$ = this.vm.likedAlbums$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likedAlbums: NewReleasesView['vm']['likedAlbums'];

    currentTracks$ = this.vm.currentTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentTracks: NewReleasesView['vm']['currentTracks'];

    selectAlbumCommand$ = this.vm.selectAlbumCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectAlbumCommand: NewReleasesView['vm']['selectAlbumCommand'];

    selectPlaylistCommand$ = this.vm.selectPlaylistCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectPlaylistCommand: NewReleasesView['vm']['selectPlaylistCommand'];

    likeAlbumCommand$ = this.vm.likeAlbumCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likeAlbumCommand: NewReleasesView['vm']['likeAlbumCommand'];

    unlikeAlbumCommand$ = this.vm.unlikeAlbumCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    unlikeAlbumCommand: NewReleasesView['vm']['unlikeAlbumCommand'];

    componentDidMount() {
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        this.didRefresh = () => { };
    }

    refresh() {
        this.setState({
            ...this.state,
        });
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

