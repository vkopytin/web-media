import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { TracksView } from '../views/tracksView';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: TracksView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('tracks'), (item, index) => {
            return <li key={index} className="table-view-cell media">
                <span className="media-object pull-left"
                    onClick={evnt => item.play(view.uri())}
                >
                    <label className={cn("toggle view ?active", view.isPlaying(item))}>
                        <div className="toggle-handle"></div>
                    </label>
                </span>
                <div className="media-body">
                    {item.name()}
                    <p>{item.album()}</p>
                </div>
                {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked() || <span className="badge">{item.duration()}</span>}
            </li>
        })}
    </ul>
</>;
