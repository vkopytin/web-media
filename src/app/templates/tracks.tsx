import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { TracksView, SelectPlaylistsView } from '../views';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: TracksView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('tracks'), (item, index) => <li key={item.id()} className="table-view-cell media">
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
                <div className="album-title">{item.album()}</div>
            </div>
            {(view.prop('selectedItem')) === item && <SelectPlaylistsView track={item} />}
            {(view.prop('selectedItem')) !== item && <SelectPlaylistsView track={item} active={true} />}
            {item.isLiked() && <span className="badge badge-positive"
                onClick={evnt => view.unlikeTrackCommand.exec(item)}
            >{item.duration()}</span>}
            {item.isLiked() || <span className="badge"
                onClick={evnt => view.likeTrackCommand.exec(item)}
            >{item.duration()}</span>}
        </li>
        )}
    </ul>
</>;
