import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { TracksView } from '../views/tracksView';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: TracksView) => <>
    <div></div>
    <ul className="todo-list table-view">
        {_.map(view.prop('tracks'), (item, index) => {
            return <li key={index} className="table-view-cell media">
                <a className="navigate-right"
                onClick={evnt => item.play(view.props.playlist.uri())}
                >
                    <span className="media-object pull-left">
                        <label className="toggle view">
                            <div className="toggle-handle"></div>
                        </label>
                    </span>
                    <div className="media-body">
                        {item.name()}
                        <p>{item.album()}</p>
                    </div>
                    <span className="badge">{item.duration()}</span>
                </a>
            </li>
        })}
    </ul>
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Part of <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
