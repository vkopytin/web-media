import React from 'react';
import { BehaviorSubject, merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/search';
import { Binding, current, Notify } from '../utils';
import { SearchViewModel, TrackViewModelItem } from '../viewModels';


export interface ISearchViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends React.Component<ISearchViewProps> {
    didRefresh: SearchView['refresh'] = () => { };
    vm = current(SearchViewModel);
    
    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: SearchView['vm']['errors'];

    term$ = this.vm.term$;
    @Binding({ didSet: (view) => view.didRefresh() })
    term: SearchView['vm']['term'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: SearchView['vm']['tracks'];

    artists$ = this.vm.artists$;
    @Binding({ didSet: (view) => view.didRefresh() })
    artists: SearchView['vm']['artists'];

    albums$ = this.vm.albums$;
    @Binding({ didSet: (view) => view.didRefresh() })
    albums: SearchView['vm']['albums'];

    playlists$ = this.vm.playlists$;
    @Binding({ didSet: (view) => view.didRefresh() })
    playlists: SearchView['vm']['playlists'];

    searchType$ = this.vm.searchType$;
    @Binding({ didSet: (view) => view.didRefresh() })
    searchType: SearchView['vm']['searchType'];

    currentAlbum$ = this.vm.currentAlbum$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentAlbum: SearchView['vm']['currentAlbum'];

    currentPlaylist$ = this.vm.currentPlaylist$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentPlaylist: SearchView['vm']['currentPlaylist'];

    currentArtist$ = this.vm.currentArtist$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentArtist: SearchView['vm']['currentArtist'];

    currentTracks$ = this.vm.currentTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentTracks: SearchView['vm']['currentTracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectedItem: SearchView['vm']['selectedItem'];

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    loadMoreCommand: SearchView['vm']['loadMoreCommand'];

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likeTrackCommand: SearchView['vm']['likeTrackCommand'];

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    unlikeTrackCommand: SearchView['vm']['unlikeTrackCommand'];

    searchTracks = _.debounce(term => {
        this.term = term;
    }, 300);

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
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

