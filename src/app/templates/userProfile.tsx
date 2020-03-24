import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { UserProfileView } from '../views';
const imgSrc = require('../../images/Spotify_Logo_RGB_Green.png');

const cn = utils.className;

export const template = (view: UserProfileView) => <div className={cn(`${view.props.className}`)}>
    <header className="bar bar-nav">
        <a className="icon icon-close pull-right" href="#"
            onClick={evnt => view.props.openLogin(false)}
        ></a>
        <h1 className="title">
            <img className="spotify-logo" src={imgSrc.default} height="32" />
        </h1>
    </header>

    <div className="content">
        <p className="content-padded">
            <a className="btn btn-block btn-outlined" href={view.prop('spotifyAuthUrl')}>
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
            <div className="input-row">
                <label>www.musixmatch.com API App Key</label>
                <input type="text" placeholder="Product name"
                    defaultValue={view.prop('musixmatchKey')}
                    onChange={evnt => view.prop('musixmatchKey', evnt.target.value)}
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
</div>;
