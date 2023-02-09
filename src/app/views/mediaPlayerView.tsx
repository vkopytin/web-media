import React, { useEffect, useReducer } from 'react';
import { formatTime, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { MediaPlayerViewModel } from '../viewModels';

const logSlider = (position: number): number => {
    // position will be between 0 and 100
    const minp = 0;
    const maxp = 100;

    // The result should be between 100 an 10000000
    const minv = Math.log(1);
    const maxv = Math.log(100);

    // calculate adjustment factor
    const scale = (maxv - minv) / (maxp - minp);

    return Math.exp(minv + scale * (position - minp));
}

const logPosition = (value: number): number => {
    // position will be between 0 and 100
    const minp = 0;
    const maxp = 100;

    // The result should be between 100 an 10000000
    const minv = Math.log(1);
    const maxv = Math.log(100);

    // calculate adjustment factor
    const scale = (maxv - minv) / (maxp - minp);

    return (Math.log(value) - minv) / scale + minp;
}

export const MediaPlayerView = ({ mediaPlayerVm = inject(MediaPlayerViewModel) }) => {
    const [, doRefresh] = useReducer(() => ({}), {});

    useEffect(() => {
        Notifications.observe(mediaPlayerVm, doRefresh);
        return () => {
            Notifications.stopObserving(mediaPlayerVm, doRefresh);
        };
    }, [mediaPlayerVm]);

    const {
        isPlaying, isLiked, volume, timePlayed, thumbnailUrl,
        duration, artistName, trackName, albumName,
        resumeCommand, pauseCommand, prevCommand, nextCommand, seekPlaybackCommand,
        volumeCommand, volumeDownCommand, volumeUpCommand,
        unlikeSongCommand, likeSongCommand, refreshPlaybackCommand,
    } = mediaPlayerVm;

    const getVolume = (): number => {
        return logPosition(volume);
    }

    const titlePlayed = (): string => {
        return formatTime(timePlayed);
    }

    const titleLeft = (): string => {
        return formatTime(duration - timePlayed);
    }

    const seekTrack = (evnt: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        const rect = (evnt.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = evnt.clientX - rect.left; //x position within the element.
        // const y = evnt.clientY - rect.top;  //y position within the element.
        const progressPercent = x / rect.width * 100;

        seekPlaybackCommand.exec(Math.round(progressPercent));
    }

    const updateVolume = (evnt: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        const rect = (evnt.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = evnt.clientX - rect.left; //x position within the element.
        // const y = evnt.clientY - rect.top;  //y position within the element.
        const progressPercent = logSlider(x / rect.width * 100);

        volumeCommand.exec(Math.round(progressPercent));
    }

    return <div className="player-playback">
        <div className="player-left">
            <div className="region">
                <div className="album-media" style={{ backgroundImage: `url(${thumbnailUrl})` }}>
                    {isPlaying || <button className="button-play icon icon-play"
                        onClick={() => resumeCommand.exec()}
                    ></button>}
                    {isPlaying && <button className="button-play icon icon-pause"
                        onClick={() => pauseCommand.exec()}
                    ></button>}
                </div>
            </div>
        </div>
        <div className="player-right">
            <div className="track-playback">
                <div className="playback-info">
                    <a className="track-info">
                        <div className="song-title">
                            <span>{trackName} - {artistName}</span>
                        </div>
                        <div className="album-title">
                            <span>{albumName}</span>
                        </div>
                    </a>
                    <div className="playback-controls">
                        <button className="button-previous icon icon-back"
                            onClick={() => prevCommand.exec()}
                        ></button>
                        <div className="playback">
                            <div className="progress-max"
                                onClick={evnt => seekTrack(evnt)}
                            >
                                <div className="progress" style={{ width: `${timePlayed / duration * 100}%` }}></div>
                            </div>
                            <div className="time-played">{titlePlayed()}</div>
                        </div>
                        <button className="button-next icon icon-forward"
                            onClick={() => nextCommand.exec()}
                        ></button>
                        <div className="time-next">-{titleLeft()}</div>
                        <button className="button-previous icon icon-sound4"
                            onClick={() => volumeDownCommand.exec()}
                        ></button>
                        <div className="playback-volume">
                            <div className="progress-max" onClick={evnt => updateVolume(evnt)}>
                                <div className="progress" style={{ width: `${getVolume()}%` }}></div>
                            </div>
                            <div className="volume-marker">
                                <span className="icon icon-sound3"></span>
                            </div>
                        </div>
                        <button className="button-next icon icon-sound"
                            onClick={() => volumeUpCommand.exec()}
                        ></button>
                    </div>
                </div>
                <div className="extra-controls">
                    {isLiked && <button className="track-more icon icon-star-filled"
                        onClick={() => unlikeSongCommand.exec()}
                    ></button>}
                    {isLiked || <button className="track-more icon icon-star"
                        onClick={() => likeSongCommand.exec()}
                    ></button>}
                    <button className="track-more icon icon-refresh"
                        onClick={() => refreshPlaybackCommand.exec()}
                    ></button>
                </div>
            </div>
        </div>
    </div>;
};
