import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { AlbumsView, SearchView, SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: SearchView) => <>
    <section className="bar bar-standard">
        <form onSubmit={e => e.preventDefault()}>
            <input type="search" placeholder="Enter search title..."
                onChange={evnt => view.searchTracks(evnt.target.value)}
                defaultValue={view.term}
            />
        </form>
    </section>
    <div className="segmented-control">
        <a className={cn("control-item ?active", view.searchType === 'track')} href="#create-public"
            onClick={evnt => { evnt.preventDefault(); view.searchType = 'track' }}
        >Tracks</a>
        <a className={cn("control-item ?active", view.searchType === 'artist')} href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.searchType = 'artist' }}
        >Artist</a>
        <a className={cn("control-item ?active", view.searchType === 'album')} href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.searchType = 'album' }}
        >Albums</a>
        <a className={cn("control-item ?active", view.searchType === 'playlist')} href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.searchType = 'playlist' }}
        >Playlists</a>
    </div>
    <ul className="table-view">
        {_.map(view.tracks, (item: SearchView['tracks'][0], index) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left player-left--32"
                    onClick={evnt => item.playTracks(view.tracks)}
                >
                    <div className="region">
                        <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            {view.isPlaying(item) || <button className="button-play icon icon-play"
                            ></button>}
                            {view.isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                        </div>
                    </div>
                </span>
                <div className="media-body"
                    onClick={evnt => view.selectedItem = view.selectedItem === item ? null : item}
                >
                    <div>
                        <span className="song-title">{item.name()}</span>
                        &nbsp;-&nbsp;
                        <span className="author-title">{item.artist()}</span>
                    </div>
                    <div className="album-title">{item.album()}</div>
                    {view.selectedItem !== item && <SelectPlaylistsView
                        showErrors={e => view.showErrors(e)}
                        track={item} active={true} />}
                </div>
                {view.selectedItem === item && <SelectPlaylistsView
                    showErrors={e => view.showErrors(e)}
                    track={item} />}
                {item.isLiked && <span className="badge badge-positive"
                    onClick={evnt => view.unlikeTrackCommand.exec(item)}
                >{item.duration()}</span>}
                {item.isLiked || <span className="badge"
                    onClick={evnt => view.likeTrackCommand.exec(item)}
                >{item.duration()}</span>}
            </li>
        })}
        {_.map(view.artists, (item: SearchView['artists'][0], index) => {
            return <li key={item.id()}>
                <div className="table-view-cell media"
                    onClick={evnt => view.currentArtist = view.currentArtist?.id() === item.id() ? null : item}
                >
                    <span className="media-object pull-left player-left--32"
                    >
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            </div>
                        </div>
                    </span>
                    <div className="media-body">
                        <div>
                            <span className="song-title">{item.name()}</span>
                        </div>
                    </div>
                </div>
                {view.currentArtist === item && <div className="card" key={item.id() + '-3'}>
                    <AlbumsView
                        showErrors={e => view.showErrors(e)}
                        currentTrackId={view.props.currentTrackId}
                        uri={null}
                        tracks={view.currentTracks}
                    />
                </div>}
            </li>
        })}
        {_.map(view.albums, (item: SearchView['albums'][0], index) => {
            return <li key={item.id()}>
                <div className="table-view-cell media"
                    onClick={evnt => view.currentAlbum = view.currentAlbum?.id() === item.id() ? null : item}
                >
                    <span className="media-object pull-left player-left--32">
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            </div>
                        </div>
                    </span>
                    <div className="media-body">
                        <div>
                            <span className="song-title">{item.name()}</span>
                        </div>
                        <div className="album-title">{item.firstArtist()}</div>
                    </div>
                    <span className="badge">{item.totalTracks()}</span>
                </div>
                {view.currentAlbum === item && <div className="card" key={item.id() + '-1'}>
                    <AlbumsView
                        showErrors={e => view.showErrors(e)}
                        currentTrackId={view.props.currentTrackId}
                        uri={view.currentAlbum?.uri()}
                        tracks={view.currentTracks}
                    />
                </div>}
            </li>
        })}
        {_.map(view.playlists, (item: SearchView['playlists'][0], index) => {
            return <li key={item.id()}>
                <div className="table-view-cell media"
                    onClick={evnt => view.currentPlaylist = view.currentPlaylist?.id() === item.id() ? null : item}
                >
                    <span className="media-object pull-left player-left--32">
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            </div>
                        </div>
                    </span>
                    <div className="media-body">
                        <div>
                            <span className="song-title">{item.name()}</span>
                        </div>
                        <div className="album-title">/{item.owner()}</div>
                        <p dangerouslySetInnerHTML={{ __html: item.description() }}></p>
                    </div>
                    <span className="badge">{item.tracksTotal()}</span>
                </div>
                {view.currentPlaylist === item && <div className="card" key={item.id() + '-2'}>
                    <AlbumsView
                        showErrors={e => view.showErrors(e)}
                        currentTrackId={view.props.currentTrackId}
                        uri={view.currentPlaylist?.uri()}
                        tracks={view.currentTracks}
                    />
                </div>}
            </li>
        })}
    </ul>
</>;
