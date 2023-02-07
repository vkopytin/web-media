import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import imgSrc from '../../images/Spotify_Logo_RGB_Green.png';
import { NoActiveDeviceError } from '../service/errors/noActiveDeviceError';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';
import { UnauthenticatedError } from '../service/errors/unauthenticatedError';
import { asyncDebounce, className as cn, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AppViewModel } from '../viewModels';
import { DevicesView, HomeView, MediaPlayerView, MyTracksView, NewReleasesView, PlaylistsView, SearchView, SwitchView, UserProfileView } from '../views';

const scrollThreshold = 15;

const getElementBottomDistance = (el: HTMLElement): number => {
    const bottom = el.scrollHeight;
    const scrollY = el.scrollTop + el.clientHeight;

    return bottom - scrollY;
}

export const AppView = ({ appViewModel = inject(AppViewModel) }) => {
    const [, doRefresh] = useReducer(() => ({}), {});
    let elScroller = null as HTMLElement | null;
    const currentTrackId = appViewModel.currentTrackId;
    const [showSelectDevices, setShowSelectDevices] = useState<'' | 'show' | 'hide'>('hide');
    const [scrolledToBottom, setScrolledToBottom] = useState(false);

    useEffect(() => {
        Notifications.observe(appViewModel, doRefresh);
        return () => {
            Notifications.stopObserving(appViewModel, doRefresh);
        };
    }, [appViewModel]);

    const toggleSelectDevices = (fromState?: 'show' | 'hide'): void => {
        const lastValue = fromState || showSelectDevices;
        if (fromState && (fromState !== showSelectDevices)) {

            return;
        }

        if (lastValue === 'show') {
            setShowSelectDevices('');

            setTimeout(() => {
                setShowSelectDevices('hide');
            }, 100);
        } else {
            setShowSelectDevices('show');
        }
    }

    const openDevices = (show: 'show' | 'hide' | boolean): void => {
        toggleSelectDevices(show ? 'hide' : 'show');
        if (show === 'show') {
            appViewModel.refreshDevicesCommand.exec();
        }
    };

    const clearErrors = (evnt: React.MouseEvent<HTMLElement, MouseEvent>): void => {
        evnt && evnt.preventDefault();
        appViewModel.errors = [];
    }

    useMemo(() => {
        const errors = appViewModel.errors;
        if (!errors?.length) {
            return;
        }

        const unauthenticated = errors.filter(err => err.is(UnauthenticatedError));
        if (unauthenticated.length) {
            appViewModel.errors = unauthenticated;
            appViewModel.isLoginVisible = true;

            return;
        }

        const tokenExpired = errors.filter(err => err.is(TokenExpiredError));
        if (tokenExpired.length) {
            appViewModel.errors = tokenExpired;
            appViewModel.isLoginVisible = true;
            setTimeout(() => appViewModel.refreshTokenCommand.exec());

            return;
        }

        const activeDevice = errors.filter(err => err.is(NoActiveDeviceError));
        if (activeDevice.length) {
            appViewModel.errors = activeDevice;
            appViewModel.currentDevice && appViewModel.switchDevice(appViewModel.currentDevice);
            setTimeout(() => toggleSelectDevices('hide'));

            return;
        }
        appViewModel.errors = errors;
    }, [appViewModel.errors.length]);

    const onPageScroll = useCallback(asyncDebounce(() => {
        if (!elScroller) {
            return;
        }
        const distance = getElementBottomDistance(elScroller);
        if (distance <= scrollThreshold) {
            scrolledToBottom || setScrolledToBottom(true);
            setTimeout(() => {
                setScrolledToBottom(false);
            }, 0);
        }
    }, 300), [appViewModel.currentPanel, scrolledToBottom]);

    return <main>
        <section className="device-content">
            {showSelectDevices === 'show' ? <div className='backdrop' onClick={() => openDevices(false)}></div>
                : appViewModel.errors.length ? <div className='backdrop' onClick={evnt => clearErrors(evnt)}></div>
                    : <div></div>
            }
            <div className={cn("popover ?visible", showSelectDevices === 'show')} style={{
                display: showSelectDevices !== 'hide' ? 'block' : 'none'
            }}>
                <header className="bar bar-nav">
                    <h1 className="title">Devices</h1>
                </header>
                <DevicesView onSwitchDevice={() => openDevices(false)} />
            </div>
            <div className={cn("popover ?visible", appViewModel.errors.length)} style={{
                display: appViewModel.errors.length ? 'block' : 'none'
            }}>
                <header className="bar bar-nav">
                    <a className="icon icon-close pull-right" href="#"
                        onClick={evnt => clearErrors(evnt)}
                    ></a>
                    <h1 className="title">Errors</h1>
                </header>
                <ul className="table-view">
                    {appViewModel.errors.map((error: Result, index) => {
                        return <li key={index} className="table-view-cell"
                            onClick={() => error.error(e => console.log(e))}
                        >
                            {error.match(() => '', e => e?.message || '')}
                        </li>
                    })}
                </ul>
            </div>
            <UserProfileView className={cn("modal ?active", appViewModel.isLoginVisible)} />
            <header className="bar bar-nav">
                {appViewModel.isSyncing === 0 ? false
                    : <div className="meter animate">
                        <span style={{ width: `${appViewModel.isSyncing}%` }}></span>
                    </div>
                }
                <a className="icon icon-info pull-left"
                    onClick={() => openDevices('show')}
                >
                </a>
                <a className="icon icon-person pull-right"
                    onClick={() => appViewModel.isLoginVisible = true}
                ></a>
                <h1 className="title">
                    <img className="spotify-logo" src={imgSrc.src} height="32"
                        onClick={() => appViewModel.refreshTokenCommand.exec()}
                    />
                </h1>
            </header>
            <div className="bar bar-standard bar-header-secondary bar-header-playback" style={{ height: '92px' }}>
                <div className="region">
                    <MediaPlayerView />
                </div>
            </div>
            <nav className="footer bar bar-tab bar-footer">
                <a className={cn('tab-item ?active', appViewModel.currentPanel === 'home')} href="#"
                    onClick={() => appViewModel.currentPanel = 'home'}
                >
                    <span className="icon icon-home"></span>
                    <span className="tab-label">Home</span>
                </a>
                <a className={cn('tab-item ?active', appViewModel.currentPanel === 'playlists')} href="#"
                    onClick={() => appViewModel.currentPanel = 'playlists'}
                >
                    <span className="icon icon icon-list"></span>
                    <span className="tab-label">Playlists</span>
                </a>
                <a className={cn('tab-item ?active', appViewModel.currentPanel === 'tracks')} href="#"
                    onClick={() => appViewModel.currentPanel = 'tracks'}
                >
                    <span className="icon icon-star-filled"></span>
                    <span className="tab-label">Favorites</span>
                </a>
                <a className={cn('tab-item ?active', appViewModel.currentPanel === 'search')} href="#"
                    onClick={() => appViewModel.currentPanel = 'search'}
                >
                    <span className="icon icon-search"></span>
                    <span className="tab-label">Search</span>
                </a>
                <a className={cn('tab-item ?active', appViewModel.currentPanel === 'releases')} href="#"
                    onClick={() => appViewModel.currentPanel = 'releases'}
                >
                    <span className="icon icon icon-info"></span>
                    <span className="tab-label">Releases</span>
                </a>
            </nav>
            <SwitchView currentView={appViewModel.currentPanel} onClick={() => toggleSelectDevices('show')}>
                <section key="home" className={cn("content ?shadow", showSelectDevices === 'show')}
                    ref={el => el && (elScroller = el)}
                    onScroll={() => onPageScroll()}
                >
                    <HomeView currentTrackId={currentTrackId} />
                </section>
                <section key="playlists" className={cn("content ?shadow", showSelectDevices === 'show')}
                    ref={el => el && (elScroller = el)}
                    onScroll={() => onPageScroll()}
                >
                    <PlaylistsView
                        loadMore={scrolledToBottom}
                        currentTrackId={currentTrackId}
                    />
                </section>
                <section key="tracks" className={cn("content ?shadow", showSelectDevices === 'show')}
                    ref={el => el && (elScroller = el)} onScroll={() => onPageScroll()}
                >
                    <MyTracksView
                        loadMore={scrolledToBottom}
                        currentTrackId={currentTrackId}
                    />
                </section>
                <section key="search" className={cn("content ?shadow", showSelectDevices === 'show')}
                    ref={el => el && (elScroller = el)} onScroll={() => onPageScroll()}
                >
                    <SearchView
                        loadMore={scrolledToBottom}
                        currentTrackId={currentTrackId}
                    />
                </section>
                <section key="releases" className={cn("content ?shadow", showSelectDevices === 'show')}
                    ref={el => el && (elScroller = el)} onScroll={() => onPageScroll()}>
                    <NewReleasesView currentTrackId={currentTrackId} />
                </section>
            </SwitchView>
        </section>
        {appViewModel.autoRefreshUrl && <iframe
            src={appViewModel.autoRefreshUrl}
            style={{ display: 'none' }}
        ></iframe>}
    </main>;
};
