import * as _ from 'underscore';
import { className as cn } from '../utils';
import { SelectPlaylistsView, TracksView } from '../views';

export const template = (view: TracksView) => <>
    <ul className={cn(`${view.props.className} table-view`)}>
        {_.map(view.tracks, (item: TracksView['tracks'][0]) => <li key={item.id()}>
            <div className="table-view-cell media"
                onTouchStart={e => view.onMouseDown(e)}
            >
                <span className="material-icons handle"
                    onMouseDown={e => view.onMouseDown(e)}
                ></span>
                <div className="info-list">
                    {item.isCached && <span className="info-item material-icons">delete</span>}
                    <span className="info-item material-icons"
                        onClick={() => view.findTrackLyricsCommand.exec(item)}
                    >receipt</span>
                </div>
                <span className="media-object pull-left player-left--32"
                    onClick={() => view.isBanned(item) || item.play(view.uri())}
                >
                    <div className="region">
                        <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            {!view.isBanned(item) && view.isPlaying(item) || <button className="button-play icon icon-play"
                            ></button>}
                            {!view.isBanned(item) && view.isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                            {view.isBanned(item) && <button className="button-play material-icons">block</button>}
                        </div>
                    </div>
                </span>
                <div className="media-body"
                    onClick={() => view.selectedItem = view.selectedItem === item ? null : item}
                >
                    <div>
                        <span className="song-title">{item.name()}</span>
                        &nbsp;-&nbsp;
                        <span className="author-title">{item.artist()}</span>
                    </div>
                    <div className="album-title"><span>{item.album()}</span>{view.selectedItem !== item && <SelectPlaylistsView
                        showErrors={e => view.showErrors(e)}
                        className="chips-list" track={item} active={true} />}</div>
                </div>
                {!view.isBanned(item) && view.selectedItem === item && <SelectPlaylistsView
                    showErrors={e => view.showErrors(e)}
                    className="chips-list" track={item} />}
                <span className="badge-region">
                    {view.isBanned(item) ? <button className="badge badge-negative badge-outlined material-icons"
                        title="Banned, tap to remove Bann"
                        onClick={() => view.removeBannFromTrackCommand.exec(item)}
                    >block</button>
                        : <button className="badge badge-positive badge-outlined material-icons"
                            title="Allowed, tab to set a bann"
                            onClick={() => view.bannTrackCommand.exec(item)}
                        >done</button>}
                    {item.isLiked && <span className="badge badge-positive"
                        onClick={() => view.unlikeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                    {item.isLiked || <span className="badge"
                        onClick={() => view.likeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                </span>
            </div>
            {(view.trackLyrics && view.trackLyrics.trackId === item.id())
                && <div className="card">{_.map(view.trackLyrics.lyrics.split('\n'), (line, index) => {
                    return <div key={index}>{line}</div>;
                })}</div>}
        </li>
        )}
    </ul>
</>;
