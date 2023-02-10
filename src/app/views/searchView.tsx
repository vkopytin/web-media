import { useServiceMonitor } from 'app/hooks';
import { useCallback, useMemo } from 'react';
import { asyncDebounce, className as cn } from '../utils';
import { inject } from '../utils/inject';
import { AlbumViewModelItem, PlaylistsViewModelItem, SearchViewModel, TrackViewModelItem } from '../viewModels';
import { ArtistViewModelItem } from '../viewModels/artistViewModelItem';
import { AlbumsView, SelectPlaylistsView } from '../views';

export interface ISearchViewProps {
    loadMore?: boolean;
    currentTrackId: string;
    searchVm?: SearchViewModel;
}

export const SearchView = ({ loadMore, currentTrackId, searchVm = inject(SearchViewModel) }: ISearchViewProps) => {
    const {
        term, searchType, tracks, selectedItem, artists, playlists, albums,
        currentAlbum, currentArtist, currentPlaylist, currentTracks,
        searchCommand, loadMoreCommand, changeSearchTypeCommand, unlikeTrackCommand, likeTrackCommand,
        selectAlbumCommand, selectArtistCommand, selectPlaylistCommand,
    } = useServiceMonitor(searchVm);

    const searchTracks = useCallback(asyncDebounce((term: string) => {
        searchCommand.exec(term);
    }, 300), [searchVm]);

    const isPlaying = (track: TrackViewModelItem): boolean => {
        return track.id() === currentTrackId;
    };

    useMemo(() => {
        if (loadMore) {
            loadMoreCommand.exec();
        }
    }, [loadMore]);

    return <>
        <section className="bar bar-standard">
            <form onSubmit={e => e.preventDefault()}>
                <input type="search" placeholder="Enter search title..."
                    onChange={evnt => searchTracks(evnt.target.value)}
                    defaultValue={term}
                />
            </form>
        </section>
        <div className="segmented-control">
            <a className={cn("control-item ?active", searchType === 'track')} href="#create-public"
                onClick={evnt => { evnt.preventDefault(); changeSearchTypeCommand.exec('track') }}
            >Tracks</a>
            <a className={cn("control-item ?active", searchType === 'artist')} href="#crate-private"
                onClick={evnt => { evnt.preventDefault(); changeSearchTypeCommand.exec('artist') }}
            >Artist</a>
            <a className={cn("control-item ?active", searchType === 'album')} href="#crate-private"
                onClick={evnt => { evnt.preventDefault(); changeSearchTypeCommand.exec('album') }}
            >Albums</a>
            <a className={cn("control-item ?active", searchType === 'playlist')} href="#crate-private"
                onClick={evnt => { evnt.preventDefault(); changeSearchTypeCommand.exec('playlist') }}
            >Playlists</a>
        </div>
        <ul className="tracks-list table-view">
            {tracks.map((item: TrackViewModelItem) => {
                return <li key={item.id()} className="table-view-cell media">
                    <span className="media-object pull-left player-left--32"
                        onClick={() => item.playTracks(tracks)}
                    >
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                {isPlaying(item) || <button className="button-play icon icon-play"
                                ></button>}
                                {isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                            </div>
                        </div>
                    </span>
                    <div className="media-body"
                        onClick={() => searchVm.selectedItem = selectedItem === item ? null : item}
                    >
                        <div>
                            <span className="song-title">{item.name()}</span>
                            &nbsp;-&nbsp;
                            <span className="author-title">{item.artist()}</span>
                        </div>
                        <div className="album-title">{item.album()}</div>
                        {selectedItem !== item && <SelectPlaylistsView
                            className="select-playlist"
                            track={item} active={true} />}
                    </div>
                    {selectedItem === item && <SelectPlaylistsView
                        className="select-playlist"
                        track={item} />}
                    {item.isLiked && <span className="badge badge-positive"
                        onClick={() => unlikeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                    {item.isLiked || <span className="badge"
                        onClick={() => likeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                </li>
            })}
            {artists.map((item: ArtistViewModelItem) => {
                return <li key={item.id()}>
                    <div className="table-view-cell media"
                        onClick={() => selectArtistCommand.exec(currentArtist?.id() === item.id() ? null : item)}
                    >
                        <span className="media-object pull-left player-left--32"
                        >
                            <div className="region">
                                <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                </div>
                            </div>
                        </span>
                        <div className="media-body">
                            <div>
                                <span className="song-title">{item.name()}</span>
                            </div>
                        </div>
                    </div>
                    {currentArtist === item && <div className="card" key={item.id() + '-3'}>
                        <AlbumsView
                            currentTrackId={currentTrackId}
                            uri={''}
                            tracks={currentTracks}
                        />
                    </div>}
                </li>
            })}
            {albums.map((item: AlbumViewModelItem) => {
                return <li key={item.id()}>
                    <div className="table-view-cell media"
                        onClick={() => selectAlbumCommand.exec(currentAlbum?.id() === item.id() ? null : item)}
                    >
                        <span className="media-object pull-left player-left--32">
                            <div className="region">
                                <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                </div>
                            </div>
                        </span>
                        <div className="media-body">
                            <div>
                                <span className="song-title">{item.name()}</span>
                            </div>
                            <div className="album-title">{item.firstArtist()}</div>
                        </div>
                        <span className="badge">{item.totalTracks()}</span>
                    </div>
                    {currentAlbum === item && <div className="card" key={item.id() + '-1'}>
                        <AlbumsView
                            currentTrackId={currentTrackId}
                            uri={currentAlbum?.uri()}
                            tracks={currentTracks}
                        />
                    </div>}
                </li>
            })}
            {playlists.map((item: PlaylistsViewModelItem) => {
                return <li key={item.id()}>
                    <div className="table-view-cell media"
                        onClick={() => selectPlaylistCommand.exec(currentPlaylist?.id() === item.id() ? null : item)}
                    >
                        <span className="media-object pull-left player-left--32">
                            <div className="region">
                                <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                </div>
                            </div>
                        </span>
                        <div className="media-body">
                            <div>
                                <span className="song-title">{item.name()}</span>
                            </div>
                            <div className="album-title">/{item.owner()}</div>
                            <p dangerouslySetInnerHTML={{ __html: item.description() }}></p>
                        </div>
                        <span className="badge">{item.tracksTotal()}</span>
                    </div>
                    {currentPlaylist === item && <div className="card" key={item.id() + '-2'}>
                        <AlbumsView
                            currentTrackId={currentTrackId}
                            uri={currentPlaylist?.uri()}
                            tracks={currentTracks}
                        />
                    </div>}
                </li>
            })}
        </ul>
    </>;
};
