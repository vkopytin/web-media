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
        {_.map(view.prop('items'), (item, index) => 
            <li key={item.id()} className="table-view-cell">
                <span className="media-object pull-left"
                    onClick={evnt => { item.playTracks(view.prop('items')) }}
                >
                    <label className={cn("toggle view ?active", view.isPlaying(item))}>
                        <div className="toggle-handle"></div>
                    </label>
                </span>
                <span className="list-item push-right">
                    <div className="media-body pull-left"
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
                </span>
                {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked() || <span className="badge">{item.duration()}</span>}
            </li>
        )}
    </ul>
    <section className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Part of <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </section>
</>;
