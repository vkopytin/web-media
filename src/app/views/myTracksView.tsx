import React, { useEffect, useReducer } from 'react';
import * as _ from 'underscore';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';
import { SelectPlaylistsView } from '../views';

export interface IMyTracksViewProps {
    currentTrackId: string;
    loadMore?: boolean;
    myTrackVm?: MyTracksViewModel;
}

export const MyTracksView = ({ currentTrackId, myTrackVm = inject(MyTracksViewModel) }: IMyTracksViewProps) => {
    const [, doRefresh] = useReducer(() => ({}), {});

    useEffect(() => {
        Notifications.observe(myTrackVm, doRefresh);
        return () => {
            Notifications.stopObserving(myTrackVm, doRefresh);
        };
    }, [myTrackVm]);

    const {
        isLoading, tracks, trackLyrics,
        findTrackLyricsCommand, loadMoreCommand,
    } = myTrackVm;

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
                        {item.isLiked && <span className="badge badge-positive">{item.duration()}</span>}
                        {item.isLiked || <span className="badge">{item.duration()}</span>}
                    </div>
                    {(trackLyrics && trackLyrics.trackId === item.id())
                        && <div className="card">{_.map(trackLyrics.lyrics.split('\n'), (line, index) => {
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
