import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { utils } from 'databindjs';
import { SearchView } from '../views';


const cn = utils.className;

export const template = (view: SearchView) => <>
    <section className="bar bar-standard">
        <form onSubmit={e => e.preventDefault()}>
            <input className="new-todo" type="search" placeholder="Enter search title..."
                onChange={evnt => view.searchTracks(evnt.target.value)}
                defaultValue={view.prop('term')}
            />
        </form>
    </section>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={index} className="table-view-cell media">
                <span className="media-object pull-left"
                    onClick={evnt => item.playTracks(view.prop('items'), item)}
                >
                    <label className="toggle view">
                        <div className="toggle-handle"></div>
                    </label>
                </span>
                <div className="media-body">
                    {item.name()}
                    <p>{item.album()}</p>
                </div>
                <span className="badge">{item.duration()}</span>
            </li>
        })}
    </ul>
</>;
