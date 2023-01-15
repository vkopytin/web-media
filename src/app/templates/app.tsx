import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { AppView, DevicesView, HomeView, MediaPlayerView, MyTracksView, NewReleasesView, PlaylistsView, SearchView, SwitchView, UserProfileView } from '../views';
const imgSrc = require('../../images/Spotify_Logo_RGB_Green.png');

const cn = utils.className;

export const template = (view: AppView) => <main>
    <section className="device-content">
        <UserProfileView
            showErrors={errors => view.showErrors(errors)}
            openLogin$={view.openLogin$}
            className={cn("modal ?active", view.openLogin)}
        />
        <div className={cn("popover ?visible", view.state.showSelectDevices === 'show')} style={{
            display: view.state.showSelectDevices !== 'hide' ? 'block' : 'none'
        }}>
            <header className="bar bar-nav">
                <h1 className="title">Devices</h1>
            </header>
            <DevicesView
                showErrors={errors => view.showErrors(errors)}
                openShowDevices={showHide => view.openDevices(showHide)}
            />
        </div>
        <div className={cn("popover ?visible", view.errors.length)} style={{
            display: view.errors.length ? 'block' : 'none'
        }}>
            <header className="bar bar-nav">
                <a className="icon icon-close pull-right" href="#"
                    onClick={evnt => view.clearErrors(evnt)}
                ></a>
                <h1 className="title">Errors</h1>
            </header>
            <ul className="table-view">
                {_.map(view.errors, (error: any, index) => {
                    return <li key={index} className="table-view-cell"
                        onClick={evnt => console.log(error.error)}
                    >
                        {'' + error.error}
                    </li>
                })}
            </ul>
        </div>
        <header className="bar bar-nav">
            {view.isSyncing === 0 ? false
                : <div className="meter animate"><span style={{ width: `${view.isSyncing}%` }}></span></div>
            }
            <a className="icon icon-info pull-left"
                onClick={evnt => view.openDevices('show')}
            >
            </a>
            <a className="icon icon-person pull-right"
                onClick={evnt => view.openLogin = true}
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
                    currentTrackId$={view.currentTrackId$}
                />
            </div>
        </div>
        <nav className="footer bar bar-tab bar-footer">
            <a className={cn('tab-item ?active', view.currentPanel === 'home')} href="#"
                onClick={evnt => view.currentPanel = 'home'}
            >
                <span className="icon icon-home"></span>
                <span className="tab-label">Home</span>
            </a>
            <a className={cn('tab-item ?active', view.currentPanel === 'playlists')} href="#"
                onClick={evnt => view.currentPanel = 'playlists'}
            >
                <span className="icon icon icon-list"></span>
                <span className="tab-label">Playlists</span>
            </a>
            <a className={cn('tab-item ?active', view.currentPanel === 'tracks')} href="#"
                onClick={evnt => view.currentPanel = 'tracks'}
            >
                <span className="icon icon-star-filled"></span>
                <span className="tab-label">Favorites</span>
            </a>
            <a className={cn('tab-item ?active', view.currentPanel === 'search')} href="#"
                onClick={evnt => view.currentPanel = 'search'}
            >
                <span className="icon icon-search"></span>
                <span className="tab-label">Search</span>
            </a>
            <a className={cn('tab-item ?active', view.currentPanel === 'releases')} href="#"
                onClick={evnt => view.currentPanel = 'releases'}
            >
                <span className="icon icon icon-info"></span>
                <span className="tab-label">Releases</span>
            </a>
        </nav>
        <SwitchView currentView={view.currentPanel} onClick={evnt => view.toggleSelectDevices('show')}>
            <section key="home" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)}
                onScroll={evnt => view.onPageScroll()}
            >
                <HomeView
                    showErrors={errors => view.showErrors(errors)}
                    currentTrackId={view.currentTrackId}
                />
            </section>
            <section key="playlists" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)}
                onScroll={evnt => view.onPageScroll()}
            >
                <PlaylistsView
                    showErrors={errors => view.showErrors(errors)}
                    loadMore={view.state.scrolledToBottom}
                    currentTrackId={view.currentTrackId}
                />
            </section>
            <section key="tracks" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)} onScroll={evnt => view.onPageScroll()}
            >
                <MyTracksView
                    showErrors={errors => view.showErrors(errors)}
                    loadMore={view.state.scrolledToBottom}
                    currentTrackId={view.currentTrackId}
                />
            </section>
            <section key="search" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)} onScroll={evnt => view.onPageScroll()}
            >
                <SearchView
                    showErrors={errors => view.showErrors(errors)}
                    loadMore={view.state.scrolledToBottom}
                    currentTrackId={view.currentTrackId}
                />
            </section>
            <section key="releases" className={cn("content ?shadow", view.state.showSelectDevices === 'show')}
                ref={el => el && (view.elScroller = el)} onScroll={evnt => view.onPageScroll()}>
                <NewReleasesView
                    showErrors={errors => view.showErrors(errors)}
                    currentTrackId={view.currentTrackId}
                />
            </section>
        </SwitchView>
    </section>
    {view.autoRefreshUrl && <iframe
        src={view.autoRefreshUrl}
        style={{ display: 'none' }}
    ></iframe>}
</main>;
