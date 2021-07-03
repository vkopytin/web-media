import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { AlbumsView, NewReleasesView, TracksView } from '../views';


const cn = utils.className;

export const template = (view: NewReleasesView) => <>
    <ul className="stack">
        {_.map(view.newReleases, (item: NewReleasesView['newReleases'][0], index) => {
            return <li key={item.id()} className="stack__card">
                <div className="card__img" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}></div>
                <a href="#" className="card_link"
                    onClick={evnt => { view.selectAlbumCommand.exec(view.currentAlbum === item ? null : item) }}
                >
                    <div className="card__img--hover" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                    </div>
                </a>
                <div className="card__info-hover">
                    {view.isLiked(item) && <span className="card__like icon icon-star-filled"
                        onClick={evnt => view.unlikeAlbumCommand.exec(item)}
                    ></span>}
                    {view.isLiked(item) || <span className="card__like icon icon-star"
                        onClick={evnt => view.likeAlbumCommand.exec(item)}
                    ></span>}
                    <div className="card__clock-info">
                        <svg className="card__clock" viewBox="0 0 24 24"><path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z"></path>
                        </svg><span className="card__time">{item.totalTracks()}</span>
                    </div>
                </div>
                <div className="card__info">
                    <span className="card__category">{item.albumType()}</span>
                    <h3 className="card__title">{item.name()}</h3>
                    <span className="card__by">
                        by<span>&nbsp;</span>
                        <a href={item.firstArtistUrl()} className="card__author" title="author">
                            {item.firstArtist()}
                        </a>
                    </span>
                </div>
            </li>
        })}
    </ul>
    {view.currentAlbum && <AlbumsView
        showErrors={e => view.showErrors(e)}
        currentTrackId={view.props.currentTrackId}
        uri={view.currentAlbum?.uri()}
        tracks={view.tracks}
    />}
    <ul className="stack">
        {_.map(view.featuredPlaylists, (item: NewReleasesView['featuredPlaylists'][0], index) => {
            return <li key={item.id()} className="stack__card">
                <div className="card__img" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}></div>
                <a href="#" className="card_link"
                    onClick={evnt => { view.selectPlaylistCommand.exec(view.currentPlaylist === item ? null : item) }}
                >
                    <div className="card__img--hover" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                    </div>
                </a>
                <div className="card__info-hover">
                    {false && <span className="card__like icon icon-star-filled"
                    ></span>}
                    {false || <span className="card__like icon icon-star"
                    ></span>}
                    <div className="card__clock-info">
                        <svg className="card__clock" viewBox="0 0 24 24"><path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z"></path>
                        </svg><span className="card__time">{item.tracksTotal()}</span>
                    </div>
                </div>
                <div className="card__info">
                    <span className="card__category">{item.name()}</span>
                    <h3 className="card__title">{item.description()}</h3>
                    <span className="card__by">
                        by<span>&nbsp;</span>
                        <a href={item.ownerUrl()} className="card__author" title="author" target="blank">
                            {item.owner()}
                        </a>
                    </span>
                </div>
            </li>
        })}
    </ul>
    {view.currentPlaylist && <AlbumsView
        showErrors={e => view.showErrors(e)}
        currentTrackId={view.props.currentTrackId}
        uri={view.currentPlaylist?.uri()}
        tracks={view.currentTracks}
    />}
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Powered by <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
