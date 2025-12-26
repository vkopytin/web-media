import { useServiceMonitor } from 'app/hooks';
import { useMemo } from 'react';
import { inject } from '../utils/inject';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';
import { SelectPlaylistsView } from '../views';

export interface IMyTracksViewProps {
    currentTrackId: string;
    loadMore?: boolean;
    myTrackVm?: MyTracksViewModel;
}

export const MyTracksView = ({ currentTrackId, loadMore, myTrackVm = inject(MyTracksViewModel) }: IMyTracksViewProps) => {
    useServiceMonitor(myTrackVm);

    const {
        isLoading, tracks, trackLyrics,
        findTrackLyricsCommand, loadMoreCommand,
    } = myTrackVm;

    useMemo(() => {
        if (loadMore) {
            loadMoreCommand.exec();
        }
    }, [loadMore]);

    const isPlaying = (track: TrackViewModelItem): boolean => {
        return currentTrackId === track.id();
    };

    return <>
        <ul className="table-view">
            {tracks.map((item: TrackViewModelItem, index) => {
                return <li key={`${index}-${item.id()}`}>
                    <div className="table-view-cell media">
                        <div className="info-list">
                            {item.isCached && <span className="info-item material-icons">delete</span>}
                            <span className="info-item material-icons"
                                onClick={() => findTrackLyricsCommand.exec(item)}
                            >receipt</span>
                        </div>
                        <span className="media-object pull-left player-left--32"
                            onClick={() => item.playTracks(tracks)}
                        >
                            <div className="region">
                                <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                    {isPlaying(item) || <button className="button-play icon icon-play"
                                        onClick={() => item.playTracks(tracks)}
                                    ></button>}
                                    {isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                                </div>
                            </div>
                        </span>
                        <div className="media-body"
                            onClick={() => myTrackVm.selectedItem = myTrackVm.selectedItem === item ? null : item}
                        >
                            <div>
                                <span className="song-title">{item.name()}</span>
                                &nbsp;-&nbsp;
                                <span className="author-title">{item.artist()}</span>
                            </div>
                            <div className="album-title">{item.album()}</div>
                            {myTrackVm.selectedItem !== item && <SelectPlaylistsView track={item} active={true} />}
                        </div>
                        {myTrackVm.selectedItem === item && <SelectPlaylistsView track={item} />}
                        {item.isLiked && <span className="badge badge-positive"
                            title="Is Liked, tap to unlike"
                        >{item.duration()}</span>}
                        {item.isLiked || <span className="badge"
                            title="Is not Liked, tap to like"
                        >{item.duration()}</span>}
                    </div>
                    {(trackLyrics && trackLyrics.trackId === item.id())
                        && <div className="card">{trackLyrics.lyrics.split('\n').map((line, index) => {
                            return <div key={index}>{line}</div>;
                        })}</div>}
                </li>
            })}
        </ul>
        <div className="center">
            {isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
                onClick={() => loadMoreCommand.exec()}
            ></button>}
            {isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
        </div>
    </>;
};
