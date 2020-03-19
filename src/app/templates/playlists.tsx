import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { PlaylistsView } from '../views/playlistsView';
import { TracksView } from '../views/tracksView';


const cn = utils.className;

export const template = (view: PlaylistsView) => <>
    <form>
        <input
            type="text"
            placeholder="Enter new playlist name..."
            defaultValue={view.prop('newPlaylistName')}
            onChange={evnt => view.prop('newPlaylistName', evnt.target.value)}
        />
    </form>
    <div className="segmented-control">
        <a className="control-item active btn-primary" href="#create-public"
            onClick={evnt => { evnt.preventDefault(); view.createPlaylistCommand.exec(true); }}
        >Create public</a>
        <a className="control-item btn-outlined btn-primary" href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.createPlaylistCommand.exec(false); }}
        >Create private</a>
    </div>
    <ul className="todo-list table-view">
        {_.map(view.prop('playlists'), (item, index) => {
            return <li key={item.id()}>
                <div className="table-view-cell media">
                <a className="navigate-right"
                    onClick={evnt => { view.selectPlaylistCommand.exec(item.id() === view.prop('currentPlaylistId') ? null : item.id()) }}
                >
                    <img className="media-object pull-left" height="60" src={item.thumbnailUrl()} alt={item.name()} />
                    <div className="media-body">
                        {item.name()}
                        <p>{item.owner()}</p>
                    </div>
                    <span className="badge">{item.tracksTotal()}</span>
                    </a>
                </div>
                {item.id() === view.prop('currentPlaylistId') && <div className="card">
                    <TracksView
                        showErrors={e => view.props.showErrors(e)}
                        key={1}
                        playlist={item}
                        currentTrackId={view.props.currentTrackId}
                    />
                    <div key={2} className="center">
                        {view.prop('isLoading') || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
                            onClick={evnt => view.loadMoreTracksCommand.exec()}
                        ></button>}
                        {view.prop('isLoading') && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
                    </div>
                </div>}
            </li>
        })}
    </ul>
    <div className="center">
        {view.prop('isLoading') || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
            onClick={evnt => view.loadMoreCommand.exec()}
        ></button>}
        {view.prop('isLoading') && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
    </div>
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Powered by <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
