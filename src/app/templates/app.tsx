import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { AppView } from '../views/app';
import { HomeView } from '../views/homeView';
import { ProfileView } from '../views/profileView';
import { utils } from 'databindjs';
import { SwitchView } from '../views/switchView';


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
                        scope: ['streaming', 'user-read-email', 'user-read-private', 'user-modify-playback-state'].join(' '),
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
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'home')} href="#"
                onClick={evnt => view.prop('currentPanel', 'home')}
            >
                <span className="icon icon-home"></span>
                <span className="tab-label">Home</span>
            </a>
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'profile')} href="#"
                onClick={evnt => view.prop('currentPanel', 'profile')}
            >
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
        <SwitchView currentView={view.prop('currentPanel')}>
            <section key="home" className="content">
                <HomeView />
            </section>
            <section key="profile" className="content">
                <ProfileView />
            </section>
        </SwitchView>
    </section>
</main>;
