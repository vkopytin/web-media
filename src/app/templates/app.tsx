import { utils } from 'databindjs';
import * as $ from 'jquery';
import * as React from 'react';
import * as _ from 'underscore';
import { AppView, DevicesView, HomeView, MediaPlayerView, MyTracksView, NewReleasesView, PlaylistsView, SearchView, SwitchView } from '../views';
const imgSrc = require('../../images/Spotify_Logo_RGB_Green.png');

const cn = utils.className;

export const template = (view: AppView) => <main>
    <section className="todoapp device-content">
        <div className={cn("modal ?active", view.prop('openLogin'))}>
            <header className="bar bar-nav">
                <a className="icon icon-close pull-right" href="#"
                    onClick={evnt => view.prop('openLogin', false)}
                ></a>
                <h1 className="title">
                    <img className="spotify-logo" src={imgSrc.default} height="32" />
                </h1>
            </header>

            <div className="content">
                <p className="content-padded">
                    <a className="btn btn-block btn-outlined" href={view.prop('refreshTokenUrl')}>
                        Login on Spotify
                    </a>
                </p>
                <form className="input-group">
                    <div className="input-row">
                        <label>Full name</label>
                        <input type="text" placeholder="Enter your Fulll name"
                            defaultValue={view.prop('profile').display_name}
                        />
                    </div>
                    <div className="input-row">
                        <label>Email</label>
                        <input type="email" placeholder="<example>@<mail>.<com>"
                            defaultValue={view.prop('profile').email}
                        />
                    </div>
                    <div className="input-row">
                        <label>Birthday</label>
                        <input type="text" placeholder="Product name"
                            defaultValue={view.prop('profile').birthdate}
                        />
                    </div>
                    <div className="input-row">
                        <label>Product</label>
                        <input type="text" placeholder="Product name"
                            defaultValue={view.prop('profile').product}
                        />
                    </div>
                </form>
                <ul className="table-view">
                    {_.map(view.prop('topTracks'), (item, index) => {
                        return <li key={item.id()} className="table-view-cell media">
                            <span className="media-object pull-left player-left--32"
                                onClick={evnt => item.playTracks(view.prop('topTracks'))}
                            >
                                <div className="region">
                                    <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                        {view.isPlaying(item) || <button className="button-play icon icon-play"
                                        ></button>}
                                        {view.isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                                    </div>
                                </div>
                            </span>
                            <div className="media-body">
                                {item.name()}
                                <p>{item.album()}</p>
                            </div>
                            <span className="badge">{item.duration()}</span>
                        </li>
                    })}
                </ul>
            </div>
        </div>
        <div className={cn("popover ?visible", view.state.showSelectDevices === 'show')} style={{
            display: view.state.showSelectDevices !== 'hide' ? 'block' : 'none'
        }}>
            <header className="bar bar-nav">
                <h1 className="title">Devices</h1>
            </header>
            <DevicesView openShowDevices={showHide => view.openDevices(showHide)} />
        </div>
        <div className={cn("popover ?visible", view.prop('errors').length)} style={{
            display: view.prop('errors').length ? 'block' : 'none'
        }}>
            <header className="bar bar-nav">
                <h1 className="title">Errors</h1>
            </header>
            <ul className="table-view">
                {_.map(view.prop('errors'), (error, index) => {
                    return <li key={index} className="table-view-cell"
                        onClick={evnt => console.log(error.error)}
                    >
                        {'' + error.error}
                    </li>
                })}
            </ul>
        </div>
        <header className="bar bar-nav">
            <a className="icon icon-info pull-left"
                onClick={evnt => view.toggleSelectDevices()}
            >
            </a>
            <a className="icon icon-person pull-right"
                onClick={evnt => view.prop('openLogin', true)}
            ></a>
            <h1 className="title">
                <img className="spotify-logo" src={imgSrc.default} height="32"
                    onClick={evnt => view.refreshTokenCommand.exec()}
                />
            </h1>
        </header>
        <div className="bar bar-standard bar-header-secondary bar-header-playback" style={{ height: '92px' }}>
            <div className="region">
                <MediaPlayerView
                    showErrors={errors => view.showErrors(errors)}
                    currentTrackId={(...args) => view.prop.apply(view, ['currentTrackId', ...args])}
                />
            </div>
        </div>
        <nav className="footer bar bar-tab bar-footer">
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'home')} href="#"
                onClick={evnt => view.prop('currentPanel', 'home')}
            >
                <span className="icon icon-home"></span>
                <span className="tab-label">Home</span>
            </a>
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'playlists')} href="#"
                onClick={evnt => view.prop('currentPanel', 'playlists')}
            >
                <span className="icon icon icon-list"></span>
                <span className="tab-label">Playlists</span>
            </a>
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'tracks')} href="#"
                onClick={evnt => view.prop('currentPanel', 'tracks')}
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
            <a className={cn('tab-item ?active', view.prop('currentPanel') === 'releases')} href="#"
                onClick={evnt => view.prop('currentPanel', 'releases')}
            >
                <span className="icon icon icon-info"></span>
                <span className="tab-label">Releases</span>
            </a>
        </nav>
        <SwitchView currentView={view.prop('currentPanel')} onClick={evnt => view.toggleSelectDevices('show')}>
            <section key="home" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)}
                onScroll={evnt => view.onPageScroll(evnt)}
            >
                <HomeView
                    showErrors={errors => view.showErrors(errors)}
                    currentTrackId={view.prop('currentTrackId')}
                />
            </section>
            <section key="playlists" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)}
                onScroll={evnt => view.onPageScroll(evnt)}
            >
                <PlaylistsView
                    showErrors={errors => view.showErrors(errors)}
                    currentTrackId={view.prop('currentTrackId')}
                />
            </section>
            <section key="tracks" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)} onScroll={evnt => view.onPageScroll(evnt)}
            >
                <MyTracksView
                    loadMore={view.prop('scrolledToBottom')}
                    currentTrackId={view.prop('currentTrackId')}
                />
            </section>
            <section key="search" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)} onScroll={evnt => view.onPageScroll(evnt)}
            >
                <SearchView
                    loadMore={view.prop('scrolledToBottom')}
                    currentTrackId={view.prop('currentTrackId')}
                />
            </section>
            <section key="releases" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)} onScroll={evnt => view.onPageScroll(evnt)}>
                <NewReleasesView currentTrackId={view.prop('currentTrackId')} />
            </section>
        </SwitchView>
    </section>
    {view.prop('autoRefreshUrl') && <iframe
        src={view.prop('autoRefreshUrl')}
        style={{ display: 'none' }}
    ></iframe>}
</main>;
