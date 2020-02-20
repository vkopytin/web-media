import * as _ from 'underscore';
import * as React from 'react';
import { MediaPlayerView } from '../views';

export const template = (view: MediaPlayerView) => <div className="player-playback">
    <div className="player-left">
        <div className="region">
            <div className="album-media">
                <button className="button-play icon icon-play"
                    onClick={evnt => view.resumeCommand.exec()}
                ></button>
                <button className="button-play icon icon-pause hidden"
                    onClick={evnt => view.resumeCommand.exec()}
                ></button>
            </div>
        </div>
    </div>
    <div className="player-right">
        <div className="track-playback">
            <div className="playback-info">
                <a className="track-info">
                    <div className="album-title">
                        <span>album title</span>
                    </div>
                    <div className="song-title">
                        <span>Song title</span>
                    </div>
                </a>
                <div className="playback-controls">
                    <button className="button-previous icon icon-back"
                        onClick={evnt => view.prevCommand.exec()}
                    ></button>
                    <div className="playback">
                        <div className="progress-max">
                            <div className="progress"></div>
                        </div>
                        <div className="time-played">1:00</div>
                    </div>
                    <button className="button-next icon icon-forward"
                        onClick={evnt => view.nextCommand.exec()}
                    ></button>
                    <div className="time-next">-1:00</div>
                    <button className="button-previous icon icon-sound4"
                        onClick={evnt => view.volumeUpCommand.exec()}
                    ></button>
                    <div className="playback-volume">
                        <div className="progress-max">
                            <div className="progress"></div>
                        </div>
                        <div className="volume-marker">
                            <span className="icon icon-sound3"></span>
                        </div>
                    </div>
                    <button className="button-next icon icon-sound"
                        onClick={evnt => view.volumeDownCommand.exec()}
                    ></button>
                </div>
            </div>
            <div className="extra-controls">
                <button className="track-more icon icon-more-vertical"></button>
                <button className="track-more icon icon-refresh"></button>
            </div>
        </div>
    </div>
</div>;
