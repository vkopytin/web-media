import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { PickPlaylistsView, SelectPlaylistsView } from '../views';
import { HomeView } from '../views/homeView';


const cn = utils.className;

export const template = (view: HomeView) => <>
    <div className="center">
        <PickPlaylistsView showErrors={e => view.showErrors(e)} />
        {view.isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon-refresh"
            onClick={evnt => view.refreshCommand.exec()}
        ></button>}
        {view.isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon-refresh"
        ></button>}
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
                        onClick={evnt => { item.playTracks(view.tracks) }}
                    >
                        <div className="region">
                            <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                {view.isPlaying(item) || <button className="button-play icon icon-play"
                                ></button>}
                                {view.isPlaying(item) && <button className="button-play icon icon-pause"></button>}
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
                            <div className="album-title"><span>{item.album()}</span>{view.selectedTrack !== item && <SelectPlaylistsView
                                showErrors={e => view.showErrors(e)}
                                className="chips-list"
                                track={item}
                                active={true} />}</div>
                        </div>
                    </span>
                    {item.isLiked && <span className="badge badge-positive"
                        onClick={evnt => view.unlikeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                    {item.isLiked || <span className="badge"
                        onClick={evnt => view.likeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                </div>
                {(view.selectedTrack) === item && <SelectPlaylistsView
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
