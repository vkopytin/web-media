import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { SelectPlaylistsView, TracksView } from '../views';


const cn = utils.className;

export const template = (view: TracksView) => <>
    <ul className={cn(`${view.props.className} todo-list table-view`)}>
        {_.map(view.prop('tracks'), (item, index) => <li key={item.id()}>
            <div className="table-view-cell media">
                <div className="info-list">
                    <span className="info-item material-icons">delete</span>
                    <span className="info-item material-icons"
                        onClick={() => view.findTrackLyricsCommand.exec(item)}
                    >receipt</span>
                </div>
                <span className="media-object pull-left player-left--32"
                    onClick={evnt => item.play(view.uri())}
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
                    <div className="album-title"><span>{item.album()}</span>{(view.prop('selectedItem')) !== item && <SelectPlaylistsView className="chips-list" track={item} active={true} />}</div>
                </div>
                {(view.prop('selectedItem')) === item && <SelectPlaylistsView className="chips-list" track={item} />}
                <span className="badge-region">
                    {item.isLiked() && <span className="badge badge-positive"
                        onClick={evnt => view.unlikeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                    {item.isLiked() || <span className="badge"
                        onClick={evnt => view.likeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                </span>
            </div>
            {(view.prop('trackLyrics') && view.prop('trackLyrics').trackId === item.id())
                && <div className="card">{_.map(view.prop('trackLyrics').lyrics.split('\n'), (line, index) => {
                    return <div key={index}>{line}</div>;
                })}</div>}
        </li>
        )}
    </ul>
</>;
