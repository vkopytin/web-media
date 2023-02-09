import React, { useEffect, useReducer, useState } from 'react';
import imgSrc from '../../images/Spotify_Logo_RGB_Green.png';
import { className as cn, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { AppViewModel, TrackViewModelItem, UserProfileViewModel } from '../viewModels';
import { When } from './controls';

export interface IUserProfileViewProps {
    className?: string;
    userProfileVm?: UserProfileViewModel;
    appVm?: AppViewModel;
}

export const UserProfileView = ({ className = '', appVm = inject(AppViewModel), userProfileVm = inject(UserProfileViewModel) }: IUserProfileViewProps) => {
    const [, doRefresh] = useReducer(() => ({}), {});
    const [doLogout, setDoLogout] = useState(false);

    useEffect(() => {
        Notifications.observe(userProfileVm, doRefresh);
        return () => {
            Notifications.stopObserving(userProfileVm, doRefresh);
        };
    }, [userProfileVm]);

    const {
        topTracks, isLoggedin, spotifyAuthUrl, profile, apiseedsKey,
        logoutCommand, updatApiseedsKeyCommand,
    } = userProfileVm;

    const isPlaying = (track: TrackViewModelItem): boolean => {
        return userProfileVm.isPlaying(track);
    }

    return <div className={cn(`${className}`)}>
        <header className="bar bar-nav">
            <a className="icon icon-close pull-right" href="#"
                onClick={() => appVm.isLoginVisible = false}
            ></a>
            <h1 className="title">
                <img className="spotify-logo" alt="spotify-logo" src={imgSrc.src} height="32" />
            </h1>
        </header>

        <div className="content">
            <p className="content-padded">
                <When itIs={isLoggedin}>
                    <a className="btn btn-block btn-outlined" href="#"
                        onClick={async (e) => {
                            e.preventDefault();
                            logoutCommand.exec();
                            setDoLogout(true);
                            setTimeout(() => setDoLogout(false), 100);
                        }}
                    >
                        Logout
                    </a>
                </When>
                <When itIs={!isLoggedin}>
                    <a className="btn btn-block btn-outlined" href={spotifyAuthUrl}>
                        Login on Spotify
                    </a>
                </When>
            </p>
            <form className="input-group">
                <div className="input-row">
                    <label>Full name</label>
                    <input type="text" placeholder="Enter your Fulll name"
                        defaultValue={profile.display_name}
                    />
                </div>
                <div className="input-row">
                    <label>Email</label>
                    <input type="email" placeholder="<example>@<mail>.<com>"
                        defaultValue={profile.email}
                    />
                </div>
                <div className="input-row">
                    <label>Birthday</label>
                    <input type="text" placeholder="Product name"
                        defaultValue={profile.birthdate}
                    />
                </div>
                <div className="input-row">
                    <label>Product</label>
                    <input type="text" placeholder="Product name"
                        defaultValue={profile.product}
                    />
                </div>
                <div className="input-row">
                    <label>ApiSeeds Key</label>
                    <input type="text" placeholder="API key"
                        onChange={evnt => updatApiseedsKeyCommand.exec(evnt.target.value)}
                        defaultValue={apiseedsKey}
                    />
                </div>
            </form>
            <ul className="table-view">
                {topTracks.map((item) => {
                    return <li key={item.id()} className="table-view-cell media">
                        <span className="media-object pull-left player-left--32"
                            onClick={() => item.playTracks(topTracks)}
                        >
                            <div className="region">
                                <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                    <When itIs={isPlaying(item)}>
                                        <button className="button-play icon icon-pause"></button>
                                    </When>
                                    <When itIs={!isPlaying(item)}>
                                        <button className="button-play icon icon-play"
                                            onClick={() => item.playTracks(topTracks)}
                                        ></button>
                                    </When>
                                </div>
                            </div>
                        </span>
                        <div className="media-body">
                            <div>
                                <span className="song-title">{item.name()}</span>
                                &nbsp;-&nbsp;
                                <span className="author-title">{item.artist()}</span>
                            </div>
                            <div className="album-title">{item.album()}</div>
                        </div>
                        <span className="badge">{item.duration()}</span>
                    </li>
                })}
            </ul>
        </div>
        <When itIs={doLogout}>
            <iframe src="https://accounts.spotify.com/logout" style={{ display: 'none' }}></iframe>
        </When>
    </div>;
};
