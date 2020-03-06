import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { HomeView } from '../views/homeView';
import { utils } from 'databindjs';
import { SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: HomeView) => <>
    <div className="center">
        <button className=" button-round btn btn-primary btn-block btn-outlined icon icon-refresh"
            onClick={evnt => view.refreshCommand.exec()}
        ></button>
    </div>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={item.id()} className="table-view-cell">
                <span className="media-object pull-left"
                    onClick={evnt => { item.playTracks(view.prop('items'), item) }}
                >
                    <label className={cn("toggle view ?active", view.isPlaying(item))}>
                        <div className="toggle-handle"></div>
                    </label>
                </span>
                <div className="media-body">
                    <div style={{ minWidth: '30vw', display: 'inline-block' }}>
                    {item.name()}
                        <p>{item.album()}</p>
                    </div>
                    <span style={{ width: '50vw', display: 'inline-block' }}>
                        <SelectPlaylistsView track={item} />
                    </span>
                </div>
                {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked() || <span className="badge">{item.duration()}</span>}
            </li>
        })}
    </ul>
    <section className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Part of <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </section>
</>;
