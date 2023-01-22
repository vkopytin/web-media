import * as _ from 'underscore';
import { className as cn } from '../utils';
import { UserProfileView } from '../views';
import imgSrc from '../../images/Spotify_Logo_RGB_Green.png';

export const template = (view: UserProfileView) => <div className={cn(`${view.props.className}`)}>
    <header className="bar bar-nav">
        <a className="icon icon-close pull-right" href="#"
            onClick={() => view.openLogin = false}
        ></a>
        <h1 className="title">
            <img className="spotify-logo" alt="spotify-logo" src={imgSrc.src} height="32" />
        </h1>
    </header>

    <div className="content">
        <p className="content-padded">
            {view.isLoggedin ? <a className="btn btn-block btn-outlined" href="#"
                onClick={e => (e.preventDefault(), view.logoutCommand.exec())}
            >
                Logout
            </a> : <a className="btn btn-block btn-outlined" href={view.spotifyAuthUrl}>
                Login on Spotify
            </a>}
        </p>
        <form className="input-group">
            <div className="input-row">
                <label>Full name</label>
                <input type="text" placeholder="Enter your Fulll name"
                    defaultValue={view.profile.display_name}
                />
            </div>
            <div className="input-row">
                <label>Email</label>
                <input type="email" placeholder="<example>@<mail>.<com>"
                    defaultValue={view.profile.email}
                />
            </div>
            <div className="input-row">
                <label>Birthday</label>
                <input type="text" placeholder="Product name"
                    defaultValue={view.profile.birthdate}
                />
            </div>
            <div className="input-row">
                <label>Product</label>
                <input type="text" placeholder="Product name"
                    defaultValue={view.profile.product}
                />
            </div>
            <div className="input-row">
                <label>ApiSeeds Key</label>
                <input type="text" placeholder="API key"
                    onChange={evnt => view.updatApiseedsKeyCommand.exec(evnt.target.value)}
                    defaultValue={view.apiseedsKey}
                />
            </div>
        </form>
        <ul className="table-view">
            {_.map(view.topTracks, (item) => {
                return <li key={item.id()} className="table-view-cell media">
                    <span className="media-object pull-left player-left--32"
                        onClick={() => item.playTracks(view.topTracks)}
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
    {view.doLogout && <iframe
        src="https://accounts.spotify.com/logout"
        style={{ display: 'none' }}
    ></iframe>}
</div>;
