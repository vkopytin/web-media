import { useServiceMonitor } from 'app/hooks';
import { inject } from '../utils/inject';
import { AlbumsViewModel, TrackViewModelItem } from '../viewModels';

import { SelectPlaylistsView } from '../views';
import { When } from './controls';

export interface IAlbumsViewProps {
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
    albumsVm?: AlbumsViewModel;
}

export const AlbumsView = ({ uri, currentTrackId, tracks, albumsVm = inject(AlbumsViewModel) }: IAlbumsViewProps) => {
    useServiceMonitor(albumsVm);

    const isPlaying = (track: TrackViewModelItem): boolean => {
        return currentTrackId === track.id();
    }

    return <ul className="table-view albums-view">
        {tracks.map((item: TrackViewModelItem) => {
            return <li key={item.id()} className="table-view-cell media">
                <span className="media-object pull-left player-left--32" onClick={() => uri ? item.play(uri) : item.playTracks(tracks)}>
                    <div className="region">
                        <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            <When itIs={isPlaying(item)}>
                                <button className="button-play icon icon-pause"></button>
                            </When>
                            <When itIs={!isPlaying(item)}>
                                <button className="button-play icon icon-play"></button>
                            </When>
                        </div>
                    </div>
                </span>
                <div className="media-body" onClick={() => albumsVm.selectedItem = albumsVm.selectedItem === item ? null : item}>
                    <span>{item.name()}&nbsp;-&nbsp;{item.artist()}</span>
                    <p>{item.album()}</p>
                </div>
                <When itIs={albumsVm.selectedItem === item}>
                    <SelectPlaylistsView className="chips-list" track={item} />
                </When>
                <When itIs={item.isLiked}>
                    <span className="badge badge-positive">{item.duration()}</span>
                </When>
                <When itIs={item.isLiked}>
                    <span className="badge">{item.duration()}</span>
                </When>
            </li>
        })}
    </ul>
};
