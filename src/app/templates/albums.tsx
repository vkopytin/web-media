import * as _ from 'underscore';
import { AlbumsView, SelectPlaylistsView } from '../views';

export const template = (view: AlbumsView) => <>
    <ul className="table-view albums-view">
        {_.map(view.tracks, (item: AlbumsView['tracks'][0]) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left player-left--32"
                    onClick={() => view.uri() ? item.play(view.uri()) : item.playTracks(view.tracks)}
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
                    onClick={() => view.selectedItem = view.selectedItem === item ? null : item}
                >
                    <span>{item.name()}&nbsp;-&nbsp;{item.artist()}</span>
                    <p>{item.album()}</p>
                </div>
                {view.selectedItem === item && <SelectPlaylistsView
                    className="chips-list"
                    track={item} />}
                {item.isLiked && <span className="badge badge-positive">{item.duration()}</span>}
                {item.isLiked || <span className="badge">{item.duration()}</span>}
            </li>
        })}
    </ul>
</>;
