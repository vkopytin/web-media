import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { AlbumsView, SearchView, SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: SearchView) => <>
    <section className="bar bar-standard">
        <form onSubmit={e => e.preventDefault()}>
            <input className="new-todo" type="search" placeholder="Enter search title..."
                onChange={evnt => view.searchTracks(evnt.target.value)}
                defaultValue={view.prop('term')}
            />
        </form>
    </section>
    <div className="segmented-control">
        <a className={cn("control-item ?active", view.prop('searchType') === 'track')} href="#create-public"
            onClick={evnt => { evnt.preventDefault(); view.prop('searchType', 'track') }}
        >Tracks</a>
        <a className={cn("control-item ?active", view.prop('searchType') === 'artist')} href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.prop('searchType', 'artist') }}
        >Artist</a>
        <a className={cn("control-item ?active", view.prop('searchType') === 'album')} href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.prop('searchType', 'album') }}
        >Albums</a>
        <a className={cn("control-item ?active", view.prop('searchType') === 'playlist')} href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.prop('searchType', 'playlist') }}
        >Playlists</a>
    </div>
    <ul className="todo-list table-view">
        {_.map(view.prop('tracks'), (item, index) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left player-left--32"
                    onClick={evnt => item.playTracks(view.prop('tracks'))}
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
                <SelectPlaylistsView track={item} />
                {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked() || <span className="badge">{item.duration()}</span>}
            </li>
        })}
        {_.map(view.prop('artists'), (item, index) => {
            return [<li key={item.id()} className="table-view-cell media"
                onClick={evnt => view.prop('currentArtist', view.prop('currentArtist')?.id() === item.id() ? null : item)}
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
            </li>,
            view.prop('currentArtist') === item && <AlbumsView
                key={item.id() + '-3'}
                currentTrackId={view.props.currentTrackId}
                uri={null}
                tracks={view.prop('currentTracks')}
            />]
        })}
        {_.map(view.prop('albums'), (item, index) => {
            return [<li key={item.id()} className="table-view-cell media"
                onClick={evnt => view.prop('currentAlbum', view.prop('currentAlbum')?.id() === item.id() ? null : item)}
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
                    <div className="album-title">{item.firstArtist()}</div>
                </div>
                <span className="badge">{item.totalTracks()}</span>
            </li>,
            view.prop('currentAlbum') === item && <AlbumsView
                key={item.id() + '-1'}
                currentTrackId={view.props.currentTrackId}
                uri={view.prop('currentAlbum')?.uri()}
                tracks={view.prop('currentTracks')}
            />
            ]
        })}
        {_.map(view.prop('playlists'), (item, index) => {
            return [<li key={item.id()} className="table-view-cell media"
                onClick={evnt => view.prop('currentPlaylist', view.prop('currentPlaylist')?.id() === item.id() ? null : item)}
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
                    <div className="album-title">/{item.owner()}</div>
                    <p dangerouslySetInnerHTML={{ __html: item.description() }}></p>
                </div>
                <span className="badge">{item.tracksTotal()}</span>
            </li>,
            view.prop('currentPlaylist') === item && <AlbumsView
                key={item.id() + '-2'}
                currentTrackId={view.props.currentTrackId}
                uri={view.prop('currentPlaylist')?.uri()}
                tracks={view.prop('currentTracks')}
            />]
        })}
    </ul>
</>;
