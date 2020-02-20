import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import {
    AppView,
    HomeView,
    PlaylistsView,
    SwitchView,
    DevicesView,
    NewReleasesView,
    SearchView,
    MediaPlayerView,
    MyTracksView
} from '../views';
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
                        scope: ['streaming', 'user-read-email', 'user-read-private', 'user-modify-playback-state'].join(' '),
                        response_type: 'token',
                        state: 123
                    })}>
                        Login on Spotify
                    </a>
                </p>
            </div>
        </div>
        <div className={cn("popover ?visible", view.state.showSelectDevices === 'show')} style={{
            display: view.state.showSelectDevices !== 'hide' ? 'block' : 'none'
        }}>
            <header className="bar bar-nav">
                <h1 className="title">Devices</h1>
            </header>
            <DevicesView />
        </div>
        <header className="bar bar-nav">
            <a className="icon icon-compose pull-right"
                onClick={evnt => view.prop('openLogin', true)}
            ></a>
            <h1 className="title" onClick={evnt => view.toggleSelectDevices()}>
                {view.prop('profile').display_name || '<Please Login>'}
                <span className="icon icon-caret"></span>
            </h1>
        </header>
        <div className="bar bar-standard bar-header-secondary" style={{ height: '92px' }}>
            <div className="region">
                <MediaPlayerView />
            </div>
        </div>
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
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'releases')} href="#"
                onClick={evnt => view.prop('currentPanel', 'releases')}
            >
                <span className="icon icon-star-filled"></span>
                <span className="tab-label">Favorites</span>
            </a>
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'search')} href="#"
                onClick={evnt => view.prop('currentPanel', 'search')}
            >
                <span className="icon icon-search"></span>
                <span className="tab-label">Search</span>
            </a>
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'tracks')} href="#"
                onClick={evnt => view.prop('currentPanel', 'tracks')}
            >
                <span className="icon icon-gear"></span>
                <span className="tab-label">Settings</span>
            </a>
        </nav>
        <SwitchView currentView={view.prop('currentPanel')} onClick={evnt => view.toggleSelectDevices('show')}>
            <section key="home" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}>
                <HomeView />
            </section>
            <section key="profile" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}>
                <PlaylistsView />
            </section>
            <section key="releases" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}>
                <NewReleasesView />
            </section>
            <section key="search" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}>
                <SearchView />
            </section>
            <section key="tracks" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}>
                <MyTracksView />
            </section>
        </SwitchView>
    </section>
</main>;
