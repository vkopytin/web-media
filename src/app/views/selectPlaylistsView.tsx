import { useServiceMonitor } from 'app/hooks';
import { className as cn } from '../utils';
import { inject } from '../utils/inject';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';
import { When } from './controls';


export interface ISelectPlaylistsViewProps {
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
    playlistsViewModel?: PlaylistsViewModel;
}

export const SelectPlaylistsView = ({ active, className, track, playlistsViewModel = inject(PlaylistsViewModel) }: ISelectPlaylistsViewProps) => {
    useServiceMonitor(track);
    useServiceMonitor(playlistsViewModel);

    const { isLoading, playlists } = playlistsViewModel;
    const { trackPlaylists, addToPlaylistCommand, removeFromPlaylistCommand } = track;

    const isPlaylistInTracksPlaylist = (playlist: PlaylistsViewModelItem): boolean => {
        const res = trackPlaylists.some((p: PlaylistsViewModelItem) => p.id() === playlist.id());
        return res;
    };

    return <div className={cn(`${className}`)}>
        <When itIs={(isLoading && !active)}>
            <span className="chips chips-positive small loading material-icons">refresh</span>
        </When>
        <When itIs={!active}>
            <span className="chips chips-positive material-icons">refresh</span>
        </When>
        {playlists.map((item: PlaylistsViewModelItem) => {
            if (isPlaylistInTracksPlaylist(item)) {
                return active
                    ? <span className="chips chips-positive small" key={item.id()}>{item.name()}</span>
                    : <span className="chips chips-positive small" key={item.id()}
                        onClick={() => removeFromPlaylistCommand.exec(track, item)}
                    >
                        {item.name()}
                    </span>
            }
            return active ? null : <span className="chips small" key={item.id()}
                onClick={() => addToPlaylistCommand.exec(track, item)}
            >
                {item.name()}
            </span>
        })}
    </div>;
};
