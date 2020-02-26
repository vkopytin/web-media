import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { PlaylistsView } from '../views/playlistsView';
import { TracksView } from '../views/tracksView';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: PlaylistsView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('playlists'), (item, index) => {
            return <li key={index} className="table-view-cell media">
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
                {item.id() === view.prop('currentPlaylistId') && <TracksView
                    showErrors={e => view.props.showErrors(e)}
                    playlist={item}
                    currentTrackId={view.props.currentTrackId}
                />}
            </li>
        })}
    </ul>
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Part of <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
