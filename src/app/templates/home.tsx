import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { HomeView } from '../views/homeView';
import { utils } from 'databindjs';
import { formatTime } from '../utils';


const cn = utils.className;

export const template = (view: HomeView) => <>
    <div className="card">
        <div className="content-padded">
            <span className="icon icon-back"
                onClick={evnt => view.prevCommand.exec()}
            ></span>
            <span className="icon icon-pause"
                onClick={evnt => view.pauseCommand.exec()}
            ></span>
            <span className="icon icon-play"
            onClick={evnt => view.resumeCommand.exec()}
            ></span>
            <span className="icon icon-forward"
                onClick={evnt => view.nextCommand.exec()}
            ></span>
            <span className="icon icon-sound"
            onClick={evnt => view.volumeUpCommand.exec()}></span>
            <span className="icon icon-sound2"></span>
            <span className="icon icon-sound3"></span>
            <span className="icon icon-sound4"
            onClick={evnt => view.volumeDownCommand.exec()}></span>
            <span className="icon icon-refresh"></span>
        </div>
    </div>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={index} className="table-view-cell">
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
            </li>
        })}
    </ul>
    <footer className="info content-padded">
        <p>Double-click to edit a todo</p>
        <p>Written by <a href="https://github.com/addyosmani">Addy Osmani</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
</>;
