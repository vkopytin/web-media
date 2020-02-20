import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { HomeView } from '../views/homeView';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: HomeView) => <>
    <div style={{ height: '46px' }}></div>
    <div className="center">
        <button className=" button-round btn btn-primary btn-block btn-outlined icon icon-refresh"
            onClick={evnt => view.refreshCommand.exec()}
        ></button>
    </div>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={index} className="table-view-cell">
                <span className="media-object pull-left"
                    onClick={evnt => { item.playTracks(view.prop('items'), item) }}
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
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Part of <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
