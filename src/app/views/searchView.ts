import React from 'react';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/search';
import { Binding, current, Notifications } from '../utils';
import { SearchViewModel, TrackViewModelItem } from '../viewModels';


export interface ISearchViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends React.Component<ISearchViewProps> {
    didRefresh: SearchView['refresh'] = this.refresh.bind(this);
    vm = current(SearchViewModel);

    errors$ = this.vm.errors$;
    @Binding({ didSet: (view, errors) => view.showErrors(errors) })
    errors: SearchView['vm']['errors'];

    term$ = this.vm.term$;
    @Binding()
    term: SearchView['vm']['term'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks: SearchView['vm']['tracks'];

    artists$ = this.vm.artists$;
    @Binding()
    artists: SearchView['vm']['artists'];

    albums$ = this.vm.albums$;
    @Binding()
    albums: SearchView['vm']['albums'];

    playlists$ = this.vm.playlists$;
    @Binding()
    playlists: SearchView['vm']['playlists'];

    searchType$ = this.vm.searchType$;
    @Binding()
    searchType: SearchView['vm']['searchType'];

    currentAlbum$ = this.vm.currentAlbum$;
    @Binding()
    currentAlbum: SearchView['vm']['currentAlbum'];

    currentPlaylist$ = this.vm.currentPlaylist$;
    @Binding()
    currentPlaylist: SearchView['vm']['currentPlaylist'];

    currentArtist$ = this.vm.currentArtist$;
    @Binding()
    currentArtist: SearchView['vm']['currentArtist'];

    currentTracks$ = this.vm.currentTracks$;
    @Binding()
    currentTracks: SearchView['vm']['currentTracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding()
    selectedItem: SearchView['vm']['selectedItem'];

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding()
    loadMoreCommand: SearchView['vm']['loadMoreCommand'];

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding()
    likeTrackCommand: SearchView['vm']['likeTrackCommand'];

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding()
    unlikeTrackCommand: SearchView['vm']['unlikeTrackCommand'];

    searchTracks = _.debounce(term => {
        this.term = term;
    }, 300);

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: ISearchViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh(args) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SearchView };

