import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { MyTracksView, SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: MyTracksView) => <>
    <ul className="todo-list table-view">
        {_.map(view.prop('items'), (item, index) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left player-left--32"
                    onClick={evnt => item.playTracks(view.prop('items'))}
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
                    onClick={evnt => view.prop('selectedItem', view.prop('selectedItem') === item ? null : item)}
                >
                    <div>
                        <span className="song-title">{item.name()}</span>
                        &nbsp;-&nbsp;
                            <span className="author-title">{item.artist()}</span>
                    </div>
                    <div className="album-title">{item.album()}</div>
                </div>
                {(view.prop('selectedItem')) === item && <SelectPlaylistsView track={item} />}
                {(view.prop('selectedItem')) !== item && <SelectPlaylistsView track={item} active={true} />}
                {item.isLiked() && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked() || <span className="badge">{item.duration()}</span>}
            </li>
        })}
    </ul>
    <div className="center">
        {view.prop('isLoading') || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
            onClick={evnt => view.loadMoreCommand.exec()}
        ></button>}
        {view.prop('isLoading') && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
    </div>
</>;
