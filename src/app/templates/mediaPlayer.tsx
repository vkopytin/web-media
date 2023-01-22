import { MediaPlayerView } from '../views';

export const template = (view: MediaPlayerView) => <div className="player-playback">
    <div className="player-left">
        <div className="region">
            <div className="album-media" style={{ backgroundImage: `url(${view.thumbnailUrl})` }}>
                {view.isPlaying || <button className="button-play icon icon-play"
                    onClick={() => view.resumeCommand.exec()}
                ></button>}
                {view.isPlaying && <button className="button-play icon icon-pause"
                    onClick={() => view.pauseCommand.exec()}
                ></button>}
            </div>
        </div>
    </div>
    <div className="player-right">
        <div className="track-playback">
            <div className="playback-info">
                <a className="track-info">
                    <div className="song-title">
                        <span>{view.trackName} - {view.artistName}</span>
                    </div>
                    <div className="album-title">
                        <span>{view.albumName}</span>
                    </div>
                </a>
                <div className="playback-controls">
                    <button className="button-previous icon icon-back"
                        onClick={() => view.prevCommand.exec()}
                    ></button>
                    <div className="playback">
                        <div className="progress-max"
                            onClick={evnt => view.seekTrack(evnt)}
                        >
                            <div className="progress" style={{ width: `${view.timePlayed / view.duration * 100}%` }}></div>
                        </div>
                        <div className="time-played">{view.titlePlayed()}</div>
                    </div>
                    <button className="button-next icon icon-forward"
                        onClick={() => view.nextCommand.exec()}
                    ></button>
                    <div className="time-next">-{view.titleLeft()}</div>
                    <button className="button-previous icon icon-sound4"
                        onClick={() => view.volumeDownCommand.exec()}
                    ></button>
                    <div className="playback-volume">
                        <div className="progress-max" onClick={evnt => view.updateVolume(evnt)}>
                            <div className="progress" style={{ width: `${view.getVolume()}%` }}></div>
                        </div>
                        <div className="volume-marker">
                            <span className="icon icon-sound3"></span>
                        </div>
                    </div>
                    <button className="button-next icon icon-sound"
                        onClick={() => view.volumeUpCommand.exec()}
                    ></button>
                </div>
            </div>
            <div className="extra-controls">
                {view.isLiked && <button className="track-more icon icon-star-filled"
                    onClick={() => view.unlikeSongCommand.exec()}
                ></button>}
                {view.isLiked || <button className="track-more icon icon-star"
                    onClick={() => view.likeSongCommand.exec()}
                ></button>}
                <button className="track-more icon icon-refresh"
                    onClick={() => view.refreshPlaybackCommand.exec()}
                ></button>
            </div>
        </div>
    </div>
</div>;
