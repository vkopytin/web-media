import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { MyTracksView, SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: MyTracksView) => <>
    <ul className="table-view">
        {_.map(view.tracks, (item: MyTracksView['tracks'][0], index) => {
            return <li key={`${index}-${item.id()}`}>
                <div className="table-view-cell media">
                    <div className="info-list">
                        {item.isCached && <span className="info-item material-icons">delete</span>}
                        <span className="info-item material-icons"
                            onClick={() => view.findTrackLyricsCommand.exec(item)}
                        >receipt</span>
                    </div>
                    <span className="media-object pull-left player-left--32"
                        onClick={evnt => item.playTracks(view.tracks)}
                    >
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                {view.isPlaying(item) || <button className="button-play icon icon-play"
                                ></button>}
                                {view.isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                            </div>
                        </div>
                    </span>
                    <div className="media-body"
                        onClick={evnt => view.selectedItem = view.selectedItem === item ? null : item}
                    >
                        <div>
                            <span className="song-title">{item.name()}</span>
                            &nbsp;-&nbsp;
                            <span className="author-title">{item.artist()}</span>
                        </div>
                        <div className="album-title">{item.album()}</div>
                        {view.selectedItem !== item && <SelectPlaylistsView
                            showErrors={e => view.showErrors(e)}
                            track={item} active={true} />}
                    </div>
                    {view.selectedItem === item && <SelectPlaylistsView
                        showErrors={e => view.showErrors(e)}
                        track={item} />}
                    {item.isLiked && <span className="badge badge-positive">{item.duration()}</span>}
                    {item.isLiked || <span className="badge">{item.duration()}</span>}
                </div>
                {(view.trackLyrics && view.trackLyrics.trackId === item.id())
                    && <div className="card">{_.map(view.trackLyrics.lyrics.split('\n'), (line, index) => {
                        return <div key={index}>{line}</div>;
                    })}</div>}
            </li>
        })}
    </ul>
    <div className="center">
        {view.isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
            onClick={evnt => view.loadMoreCommand.exec()}
        ></button>}
        {view.isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
    </div>
</>;
