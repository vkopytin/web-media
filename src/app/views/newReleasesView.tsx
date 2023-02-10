import { useServiceMonitor } from 'app/hooks';
import React, { useEffect, useReducer } from 'react';
import { Notifications } from '../utils';
import { inject } from '../utils/inject';
import { AlbumViewModelItem, NewReleasesViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';
import { AlbumsView } from './albumsView';

export interface INewReleasesViewProps {
    currentTrackId: string;
    newReleasesVm?: NewReleasesViewModel;
}

export const NewReleasesView = ({ currentTrackId, newReleasesVm = inject(NewReleasesViewModel) }: INewReleasesViewProps) => {
    useServiceMonitor(newReleasesVm);

    const {
        tracks, likedAlbums, newReleases, currentAlbum, currentPlaylist, currentTracks, featuredPlaylists,
        selectAlbumCommand, unlikeAlbumCommand, likeAlbumCommand, selectPlaylistCommand
    } = newReleasesVm;

    const isLiked = (album: AlbumViewModelItem): boolean => {
        return likedAlbums.some((item: AlbumViewModelItem) => item.id() === album.id());
    }

    return <>
        <ul className="stack albums">
            {newReleases.map((item: AlbumViewModelItem) => {
                return <li key={item.id()} className="stack__card">
                    <div className="card__img" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}></div>
                    <a href="#" className="card_link"
                        onClick={() => { selectAlbumCommand.exec(currentAlbum === item ? null : item) }}
                    >
                        <div className="card__img--hover" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                        </div>
                    </a>
                    <div className="card__info-hover">
                        {isLiked(item) && <span className="card__like icon icon-star-filled"
                            onClick={() => unlikeAlbumCommand.exec(item)}
                        ></span>}
                        {isLiked(item) || <span className="card__like icon icon-star"
                            onClick={() => likeAlbumCommand.exec(item)}
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
        {currentAlbum && <AlbumsView
            currentTrackId={currentTrackId}
            uri={currentAlbum?.uri()}
            tracks={tracks}
        />}
        <ul className="stack playlists">
            {featuredPlaylists.map((item: PlaylistsViewModelItem) => {
                return <li key={item.id()} className="stack__card">
                    <div className="card__img" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}></div>
                    <a href="#" className="card_link"
                        onClick={() => { selectPlaylistCommand.exec(currentPlaylist === item ? null : item) }}
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
        {currentPlaylist && <AlbumsView
            currentTrackId={currentTrackId}
            uri={currentPlaylist?.uri()}
            tracks={currentTracks}
        />}
        <footer className="info content-padded">
            <p>Media Player</p>
            <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
            <p>Powered by <a href="https://github.com/vkopytin/web-media/blob/main/src/app/utils/databinding.ts#:~:text=Binding%3CT">DataBind JS</a></p>
        </footer>
    </>;
};
