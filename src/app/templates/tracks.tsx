import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { TracksView, SelectPlaylistsView } from '../views';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: TracksView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('tracks'), (item, index) => <li key={item.id()} className="table-view-cell media">
            <span className="media-object pull-left"
                onClick={evnt => item.play(view.uri())}
            >
                <label className={cn("toggle view ?active", view.isPlaying(item))}>
                    <div className="toggle-handle"></div>
                </label>
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
            {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
            {item.isLiked() || <span className="badge">{item.duration()}</span>}
        </li>
        )}
    </ul>
</>;
