import * as $ from 'jquery';
import * as _ from 'underscore';
import * as React from 'react';
import { NewReleasesView, AlbumsView } from '../views';
import { utils } from 'databindjs';


const cn = utils.className;

export const template = (view: NewReleasesView) => <>
    <div style={{height: '55px'}}></div>
    <ul className="todo-list table-view">
        {_.map(view.prop('releases'), (item, index) => {
            return <li key={index} className="table-view-cell media">
                <a className="navigate-right"
                    onClick={evnt => { view.selectAlbumCommand.exec(view.prop('currentAlbum') === item ? null : item) }}
                >
                    <img className="media-object pull-left" height="60" src={item.thumbnailUrl()} alt={item.name()} />
                    <div className="media-body">
                        {item.name()}
                        <p>{item.releaseDate()}</p>
                    </div>
                    <span className="badge">{item.totalTracks()}</span>
                </a>
                {view.prop('currentAlbum') === item && <AlbumsView album={item} />}
            </li>
        })}
    </ul>
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Part of <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
