import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { ProfileView } from '../views/profileView';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: ProfileView) => <>
    <div></div>
    <ul className="todo-list table-view">
        {_.map(_.range(0, 100), index => {
            return <li key={index} className="table-view-cell">
                <span className="media-object pull-left">
                    <label className="toggle view">
                        <div className="toggle-handle"></div>
                    </label>
                </span>
                <div className="media-body">
                    <div className="input-group">
                        <label className="view input">profile</label>
                    </div>
                </div>
                <button className="destroy btn">
                    <span className="icon icon-more"></span>
                    <span className="badge">5</span>
                </button>
            </li>
        })}
    </ul>
    <footer className="info content-padded">
        <p>Double-click to edit a todo</p>
        <p>Written by <a href="https://github.com/addyosmani">Addy Osmani</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
</>;
