import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { AppView } from '../views/app';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: AppView) => <main>
    <section className="todoapp device-content">
        <div className={cn("modal ?active", view.prop('openLogin'))}>
            <header className="bar bar-nav">
                <a className="icon icon-close pull-right" href="#"
                    onClick={evnt => view.prop('openLogin', false)}
                ></a>
                <h1 className="title">Login</h1>
            </header>

            <div className="content">
                <p className="content-padded">
                    <a href={"https://accounts.spotify.com/authorize?" + $.param({
                        client_id: '963f916fa62c4186a4b8370e16eef658',
                        redirect_uri: 'https://localhost:4443/index',
                        scope: 'user-read-private user-read-email',
                        response_type: 'token',
                        state: 123
                    })}>
                        Login on Spotify
                    </a>
                </p>
            </div>
        </div>
        <header className="bar bar-nav">
            <a className="icon icon-compose pull-right"
                onClick={evnt => view.prop('openLogin', true)}
            ></a>
            <h1 className="title">Title</h1>
        </header>
        <section className="bar bar-standard bar-header-secondary">
            <form onSubmit={e => e.preventDefault()}>
                <input className="new-todo" type="search" placeholder="Enter search title..." />
            </form>
        </section>
        <nav className="footer bar bar-tab bar-footer">
            <a className="tab-item active" href="#">
                <span className="icon icon-home"></span>
                <span className="tab-label">Home</span>
            </a>
            <a className="tab-item" href="#">
                <span className="icon icon-person"></span>
                <span className="tab-label">Profile</span>
            </a>
            <a className="tab-item" href="#">
                <span className="icon icon-star-filled"></span>
                <span className="tab-label">Favorites</span>
            </a>
            <a className="tab-item" href="#">
                <span className="icon icon-search"></span>
                <span className="tab-label">Search</span>
            </a>
            <a className="tab-item" href="#">
                <span className="icon icon-gear"></span>
                <span className="tab-label">Settings</span>
            </a>
        </nav>
        <section className="content">
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
                                <label className="view input">title</label>
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
        </section>
    </section>
</main>;
