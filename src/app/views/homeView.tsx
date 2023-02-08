import { useEffect, useReducer } from 'react';
import { Notifications } from '../utils';
import { inject } from '../utils/inject';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';
import { PickPlaylistsView, SelectPlaylistsView } from '../views';
import { When } from './controls';

export interface IHomeViewProps {
    currentTrackId: string;
    homeVm?: HomeViewModel;
}

export const HomeView = ({ currentTrackId, homeVm = inject(HomeViewModel) }: IHomeViewProps) => {
    const [, doRefresh] = useReducer(() => ({}), {});

    const { isLoading, tracks, trackLyrics,
        refreshCommand, findTrackLyricsCommand, removeBannFromTrackCommand,
        bannTrackCommand, unlikeTrackCommand, likeTrackCommand
    } = homeVm;

    useEffect(() => {
        Notifications.observe(homeVm, doRefresh);
        return () => {
            Notifications.stopObserving(homeVm, doRefresh);
        };
    }, [homeVm]);

    const isPlaying = (track: TrackViewModelItem): boolean => {
        return currentTrackId === track.id();
    }

    const isBanned = (track: TrackViewModelItem): boolean => {
        const res = homeVm.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }

    const toggleSelectedTrack = (track: TrackViewModelItem) => {
        homeVm.selectedTrack = homeVm.selectedTrack === track ? null : track;
    }

    return <>
        <div className="center">
            <When itIs={!isLoading}>
                <button className="pull-right button-round small btn btn-primary btn-block btn-outlined icon icon-refresh"
                    onClick={() => refreshCommand.exec()}
                ></button>
            </When>
            <When itIs={isLoading}>
                <button className="pull-right loading small button-round btn btn-primary btn-block btn-outlined icon icon-refresh"
                ></button>
            </When>
            <div className="chips-list pull-left">
                <span className="chips chips-positive"
                    onClick={() => refreshCommand.exec(currentTrackId)}
                >
                    Current Song
                </span>
            </div>
            <PickPlaylistsView />
        </div>
        <ul className="table-view">
            {tracks.map((item: TrackViewModelItem) =>
                <li key={item.id()}>
                    <div className="table-view-cell media">
                        <div className="info-list">
                            <span className="info-item material-icons"
                                onClick={() => findTrackLyricsCommand.exec(item)}
                            >receipt</span>
                        </div>
                        <span className="media-object pull-left player-left--32"
                            onClick={() => { isBanned(item) || item.playTracksCommand.exec(homeVm.tracks) }}
                        >
                            <div className="region">
                                <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                                    <When itIs={!isBanned(item) && !isPlaying(item)}>
                                        <button className="button-play icon icon-play"></button>
                                    </When>
                                    <When itIs={!isBanned(item) && isPlaying(item)}>
                                        <button className="button-play icon icon-pause">
                                        </button>
                                    </When>
                                    <When itIs={isBanned(item)}>
                                        <button className="button-play material-icons">block</button>
                                    </When>
                                </div>
                            </div>
                        </span>
                        <span className="list-item push-right">
                            <div className="media-body"
                                onClick={() => toggleSelectedTrack(item)}
                            >
                                <div>
                                    <span className="song-title">{item.name()}</span>
                                    &nbsp;-&nbsp;
                                    <span className="author-title">{item.artist()}</span>
                                </div>
                                <div className="album-title">
                                    <span>{item.album()}</span>
                                    <When itIs={homeVm.selectedTrack !== item}>
                                        <SelectPlaylistsView
                                            className="chips-list"
                                            track={item}
                                            active={true} />
                                    </When>
                                </div>
                            </div>
                            <When itIs={isBanned(item)}>
                                <button className="action chips btn btn-negative btn-outlined material-icons"
                                    title="Banned, tap to remove Bann"
                                    onClick={() => removeBannFromTrackCommand.exec(item)}
                                >block</button>
                            </When>
                            <When itIs={!isBanned(item)}>
                                <button className="action chips btn btn-positive btn-outlined material-icons"
                                    title="Allowed, tab to set a bann"
                                    onClick={() => bannTrackCommand.exec(item)}
                                >done</button>
                            </When>
                        </span>
                        <When itIs={item.isLiked}>
                            <span className="badge badge-positive"
                                onClick={() => unlikeTrackCommand.exec(item)}
                            >{item.duration()}</span>
                        </When>
                        <When itIs={!item.isLiked}>
                            <span className="badge"
                                onClick={() => likeTrackCommand.exec(item)}
                            >{item.duration()}</span>
                        </When>
                    </div>
                    <When itIs={!isBanned(item) && homeVm.selectedTrack === item}>
                        <SelectPlaylistsView
                            className="chips-list"
                            track={item} />
                    </When>
                    <When itIs={(trackLyrics && trackLyrics.trackId === item.id())}>
                        <div className="card">{trackLyrics?.lyrics.split('\n').map((line, index) => {
                            return <div key={index}>{line}</div>;
                        })}</div>
                    </When>
                </li>
            )}
        </ul>
        <section className="info content-padded">
            <p>Media Player</p>
            <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
            <p>Powered by <a href="https://github.com/vkopytin/web-media/blob/main/src/app/utils/databinding.ts#:~:text=Binding%3CT">DataBind JS</a></p>
        </section>
    </>;
};
