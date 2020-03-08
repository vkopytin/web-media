import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { MyTracksView, SelectPlaylistsView } from '../views';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: MyTracksView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left"
                    onClick={evnt => item.playTracks(view.prop('items'))}
                >
                    <label className={cn("toggle view ?active", view.isPlaying(item))}>
                        <div className="toggle-handle"></div>
                    </label>
                </span>
                <div className="media-body">
                    <div>
                        <span className="song-title">{item.name()}</span>
                        &nbsp;-&nbsp;
                            <span className="author-title">{item.artist()}</span>
                    </div>
                    <div className="album-title">{item.album()}</div>
                </div>
                <SelectPlaylistsView track={item} />
                {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked() || <span className="badge">{item.duration()}</span>}
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
