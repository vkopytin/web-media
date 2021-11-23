import * as React from 'react';
import * as _ from 'underscore';
import { PickPlaylistsView, SelectPlaylistsView } from '../views';
import { HomeView } from '../views/homeView';


export const template = (view: HomeView) => <>
    <div className="center">
        {view.isLoading || <button className="pull-right button-round small btn btn-primary btn-block btn-outlined icon icon-refresh"
            onClick={evnt => view.refreshCommand.exec()}
        ></button>}
        {view.isLoading && <button className="pull-right loading small button-round btn btn-primary btn-block btn-outlined icon icon-refresh"
        ></button>}
        <div className="chips-list pull-left">
            <span className="chips chips-positive" onClick={evnt => view.refreshCommand.exec(view.props.currentTrackId)}>Current Song</span>
        </div>
        <PickPlaylistsView showErrors={e => view.showErrors(e)} />
    </div>
    <ul className="todo-list table-view">
        {_.map(view.tracks, (item: HomeView['tracks'][0], index) =>
            <li key={item.id()}>
                <div className="table-view-cell media">
                    <div className="info-list">
                        <span className="info-item material-icons"
                            onClick={() => view.findTrackLyricsCommand.exec(item)}
                        >receipt</span>
                    </div>
                    <span className="media-object pull-left player-left--32"
                        onClick={evnt => { view.isBanned(item) || item.playTracksCommand.exec(view.tracks) }}
                    >
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                {!view.isBanned(item) && view.isPlaying(item) || <button className="button-play icon icon-play"
                                ></button>}
                                {!view.isBanned(item) && view.isPlaying(item) && <button className="button-play icon icon-pause">
                                </button>}
                                {view.isBanned(item) && <button className="button-play material-icons">block</button>}
                            </div>
                        </div>
                    </span>
                    <span className="list-item push-right">
                        <div className="media-body"
                            onClick={evnt => view.selectedTrack = view.selectedTrack === item ? null : item}
                        >
                            <div>
                                <span className="song-title">{item.name()}</span>
                                &nbsp;-&nbsp;
                                <span className="author-title">{item.artist()}</span>
                            </div>
                            <div className="album-title">
                                <span>{item.album()}</span>
                                {view.selectedTrack !== item && <SelectPlaylistsView
                                    showErrors={e => view.showErrors(e)}
                                    className="chips-list"
                                    track={item}
                                    active={true} />}
                            </div>
                        </div>
                        {view.isBanned(item) ? <button className="action chips btn btn-negative btn-outlined material-icons"
                            title="Banned, tap to remove Bann"
                            onClick={evnt => view.removeBannFromTrackCommand.exec(item)}
                        >block</button>
                            : <button className="action chips btn btn-positive btn-outlined material-icons"
                            title="Allowed, tab to set a bann"
                            onClick={evnt => view.bannTrackCommand.exec(item)}
                        >done</button>}
                    </span>
                    {item.isLiked && <span className="badge badge-positive"
                        onClick={evnt => view.unlikeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                    {item.isLiked || <span className="badge"
                        onClick={evnt => view.likeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                </div>
                {!view.isBanned(item) && view.selectedTrack === item && <SelectPlaylistsView
                    showErrors={e => view.showErrors(e)}
                    className="chips-list"
                    track={item} />}
                {(view.trackLyrics && view.trackLyrics.trackId === item.id())
                    && <div className="card">{_.map(view.trackLyrics.lyrics.split('\n'), (line, index) => {
                        return <div key={index}>{line}</div>;
                    })}</div>}
            </li>
        )}
    </ul>
    <section className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Powered by <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </section>
</>;
