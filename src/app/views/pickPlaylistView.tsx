import { useServiceMonitor } from '../hooks';
import { PlaylistsService } from '../service/playlistsService';
import { inject } from '../utils/inject';
import { HomeViewModel, PlaylistsViewModelItem } from '../viewModels';

export const PickPlaylistsView = ({ homeVm = inject(HomeViewModel), playlistsService = inject(PlaylistsService) }) => {
    useServiceMonitor(homeVm);
    useServiceMonitor(playlistsService);

    const { selectedPlaylist, selectPlaylistCommand } = homeVm;
    const { playlists } = playlistsService;

    return <div className="pick-playlists chips-list">
        {playlists.map((item: PlaylistsViewModelItem) => {
            if (item && selectedPlaylist === item) {
                return <span className="chips chips-positive small" key={item.id()}
                    onClick={() => selectPlaylistCommand.exec(null)}
                >
                    {item.name()}
                </span>
            }
            return <span className="chips small" key={item.id()}
                onClick={() => selectPlaylistCommand.exec(item)}
            >
                {item.name()}
            </span>
        })}
    </div>;
};
