import { useServiceMonitor } from 'app/hooks';
import { PlaylistsService } from 'app/service';
import { useMemo } from 'react';
import { inject } from '../utils/inject';
import { PlaylistsViewModel, PlaylistsViewModelItem } from '../viewModels';
import { TracksView } from '../views/tracksView';
import { When } from './controls';

export interface IPlaylistsViewProps {
    currentTrackId: string;
    loadMore?: boolean;
    playlistVm?: PlaylistsViewModel;
    playlistsService?: PlaylistsService;
}

export const PlaylistsView = ({ currentTrackId, loadMore, playlistVm = inject(PlaylistsViewModel) }: IPlaylistsViewProps) => {
    useServiceMonitor(playlistVm);

    useMemo(() => {
        if (loadMore) {
            playlistVm.loadMoreCommand.exec();
        }
    }, [loadMore]);

    return <>
        <form onSubmit={e => e.preventDefault()}>
            <input
                type="text"
                placeholder="Enter new playlist name..."
                defaultValue={playlistVm.newPlaylistName}
                onChange={evnt => playlistVm.newPlaylistName = evnt.target.value}
            />
        </form>
        <div className="segmented-control">
            <a className="control-item active btn-primary" href="#create-public"
                onClick={evnt => { evnt.preventDefault(); playlistVm.createPlaylistCommand.exec(true); }}
            >Create public</a>
            <a className="control-item btn-outlined btn-primary" href="#crate-private"
                onClick={evnt => { evnt.preventDefault(); playlistVm.createPlaylistCommand.exec(false); }}
            >Create private</a>
        </div>
        <ul className="table-view">
            {playlistVm.playlists.map((item: PlaylistsViewModelItem) => {
                return <li key={item.id()}>
                    <div className="table-view-cell media">
                        <a className="navigate-right"
                            onClick={() => { playlistVm.selectPlaylistCommand.exec(item.id() === playlistVm.currentPlaylistId ? null : item.id()) }}
                        >
                            <img className="media-object pull-left" height="60" src={item.thumbnailUrl()} alt={item.name()} />
                            <div className="media-body">
                                {item.name()}
                                <p>{item.owner()}</p>
                            </div>
                            <span className="badge">{item.tracksTotal()}</span>
                        </a>
                    </div>
                    <When itIs={item.id() === playlistVm.currentPlaylistId}>
                        <div className="card">
                            <TracksView
                                className="tracks-list"
                                key={currentTrackId}
                                playlist={item}
                                currentTrackId={currentTrackId}
                            />
                            <div key={2} className="center">
                                {playlistVm.isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
                                    onClick={() => playlistVm.loadMoreTracksCommand.exec()}
                                ></button>}
                                {playlistVm.isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
                            </div>
                        </div>
                    </When>
                </li>
            })}
        </ul>
        <div className="center">
            {playlistVm.isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
                onClick={() => playlistVm.loadMoreCommand.exec()}
            ></button>}
            {playlistVm.isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
        </div>
        <footer className="info content-padded">
            <p>Media Player</p>
            <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
            <p>Powered by <a href="https://github.com/vkopytin/web-media/blob/main/src/app/utils/databinding.ts#:~:text=Binding%3CT">DataBind JS</a></p>
        </footer>
    </>;
};
