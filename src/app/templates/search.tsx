import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { utils } from 'databindjs';
import { SearchView, SelectPlaylistsView } from '../views';


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
        {_.map(view.prop('items'), (item, index) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left"
                    onClick={evnt => item.playTracks(view.prop('items'))}
                >
                    <label className={cn("toggle view ?active", view.isPlaying(item))}>
                        <div className="toggle-handle"></div>
                    </label>
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
    </ul>
</>;
