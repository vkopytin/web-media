import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { MyTracksView, SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: MyTracksView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={item.id()}>
                <div className="table-view-cell media">
                    <div className="info-list">
                        {item.prop('isCached') && <span className="info-item material-icons">delete</span>}
                        <span className="info-item material-icons"
                            onClick={() => view.findTrackLyricsCommand.exec(item)}
                        >receipt</span>
                    </div>
                    <span className="media-object pull-left player-left--32"
                        onClick={evnt => item.playTracks(view.prop('items'))}
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
                        onClick={evnt => view.prop('selectedItem', view.prop('selectedItem') === item ? null : item)}
                    >
                        <div>
                            <span className="song-title">{item.name()}</span>
                            &nbsp;-&nbsp;
                                <span className="author-title">{item.artist()}</span>
                        </div>
                        <div className="album-title">{item.album()}</div>
                        {(view.prop('selectedItem')) !== item && <SelectPlaylistsView
                            showErrors={e => view.showErrors(e)}
                            track={item} active={true} />}
                    </div>
                    {(view.prop('selectedItem')) === item && <SelectPlaylistsView
                        showErrors={e => view.showErrors(e)}
                        track={item} />}
                    {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                    {item.isLiked() || <span className="badge">{item.duration()}</span>}
                </div>
                {(view.prop('trackLyrics') && view.prop('trackLyrics').trackId === item.id())
                && <div className="card">{_.map(view.prop('trackLyrics').lyrics.split('\n'), (line, index) => {
                    return <div key={index}>{line}</div>;
                })}</div>}
            </li>
        })}
    </ul>
    <div className="center">
        {view.prop('isLoading') || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
            onClick={evnt => view.loadMoreCommand.exec()}
        ></button>}
        {view.prop('isLoading') && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
    </div>
</>;
