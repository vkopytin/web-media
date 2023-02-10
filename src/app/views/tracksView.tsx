import { useServiceMonitor } from 'app/hooks';
import $ from 'jquery';
import React from 'react';
import { className as cn } from '../utils';
import { inject } from '../utils/inject';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';
import { SelectPlaylistsView } from '../views';

export interface ITracksViewProps {
    className?: string;
    playlist: PlaylistsViewModelItem;
    currentTrackId: string;
    playlistsVm?: PlaylistsViewModel;
}

function elementIndex(el: HTMLElement) {
    const nodes = Array.prototype.slice.call(el.parentNode?.childNodes || []);
    const index = nodes.indexOf(el);
    return index + 1;
}

export const TracksView = ({ className, currentTrackId, playlist, playlistsVm = inject(PlaylistsViewModel) }: ITracksViewProps) => {
    const {
        tracks, selectedItem, trackLyrics,
        likeTrackCommand, unlikeTrackCommand, bannTrackCommand, removeBannFromTrackCommand,
        findTrackLyricsCommand, bannedTrackIds, reorderTrackCommand,
    } = useServiceMonitor(playlistsVm);
    const state = {
        draggedIndex: 0,
        dragIndex: 0
    };

    const uri = (): string => {
        return playlist.uri();
    }

    const isPlaying = (track: TrackViewModelItem): boolean => {
        return track.id() === currentTrackId;
    }

    const onMouseDown = (e: React.MouseEvent<HTMLElement, MouseEvent> | React.TouchEvent<HTMLElement>): void => {
        //console.log('onMouseDown');
        const target = getTrNode(e.target as HTMLElement);
        if (target) {
            target.setAttribute('draggable', 'true');
            target.ondragstart = onDragStart;
            target.ondragend = onDragEnd;
        }
    }

    const onDragStart = (e: DragEvent): void => {
        //console.log('onDragStart');
        const target = getTrNode(e.target as HTMLElement);
        if (target) {
            //e.dataTransfer.setData('Text', '');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
            console.log('target.parentElement:', target.parentElement);
            if (target.parentElement) {
                target.parentElement.ondragenter = e => onDragEnter(e, target);
                target.parentElement.ondragover = function (ev) {
                    //         console.log('Tbody ondragover:',ev)
                    //         ev.target.dataTransfer.effectAllowed = 'none'
                    ev.preventDefault();
                    return true;
                };
                target.parentElement.ondragleave = e => onDragLeave(e);
            }
            const rowIndex = elementIndex(target);
            const dragIndex = rowIndex - 1;
            console.log('dragIndex:', dragIndex);
            state.dragIndex = dragIndex;
            state.draggedIndex = dragIndex;
        }
    }

    const onDragEnter = (e: Event, el: HTMLElement): void => {
        const target = getTrNode(e.target as HTMLElement);
        $(target).toggleClass('dragged-place', true);
        const rowIndex = elementIndex(target);
        console.log('onDragEnter TR index:', rowIndex - 1);
        state.draggedIndex = target ? rowIndex - 1 : -1;
        if (state.dragIndex > state.draggedIndex) {
            $(el).insertBefore(target);
        } else {
            $(el).insertAfter(target);
        }
    }

    const onDragLeave = (e: Event): void => {
        const target = getTrNode(e.target as HTMLElement);
        $(target).toggleClass('dragged-place', false);
    }

    const onDragEnd = (e: DragEvent): void => {
        console.log('onDragEnd');
        const target = getTrNode(e.target as HTMLElement);
        if (target) {
            $(target).removeAttr('draggable');
            target.ondragstart = null;
            target.ondragend = null;
            if (target.parentElement) {
                target.parentElement.ondragenter = null;
                target.parentElement.ondragover = null;
            }
            changeRowIndex();
            $('li', $(target).parent()).toggleClass('dragged-place', false);
        }
    }

    const getTrNode = (target: HTMLElement) => {
        //console.log('dragContainer:', this.refs.dragContainer)
        //return closest(target, 'tr', this.refs.dragContainer.tableNode);
        return $(target).closest('li')[0];
    }

    const changeRowIndex = (): void => {
        const dragIndex = state.dragIndex;
        const draggedIndex = state.draggedIndex;
        if (
            dragIndex >= 0 &&
            dragIndex !== draggedIndex
        ) {
            reorderTrackCommand.exec(tracks[dragIndex], tracks[draggedIndex]);
        }
        state.dragIndex = -1;
        state.draggedIndex = -1;
    }

    const isBanned = (track: TrackViewModelItem): boolean => {
        const res = bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }

    return <ul className={cn(`${className} table-view`)}>
        {tracks.map((item: TrackViewModelItem) => <li key={item.id()}>
            <div className="table-view-cell media"
                onTouchStart={e => onMouseDown(e)}
            >
                <span className="material-icons handle"
                    onMouseDown={e => onMouseDown(e)}
                ></span>
                <div className="info-list">
                    {item.isCached && <span className="info-item material-icons">delete</span>}
                    <span className="info-item material-icons"
                        onClick={() => findTrackLyricsCommand.exec(item)}
                    >receipt</span>
                </div>
                <span className="media-object pull-left player-left--32"
                    onClick={() => isBanned(item) || item.play(uri())}
                >
                    <div className="region">
                        <div className="album-media" style={{ backgroundImage: `url(${item.thumbnailUrl()})` }}>
                            {!isBanned(item) && isPlaying(item) || <button className="button-play icon icon-play"
                            ></button>}
                            {!isBanned(item) && isPlaying(item) && <button className="button-play icon icon-pause"></button>}
                            {isBanned(item) && <button className="button-play material-icons">block</button>}
                        </div>
                    </div>
                </span>
                <div className="media-body"
                    onClick={() => playlistsVm.selectedItem = selectedItem === item ? null : item}
                >
                    <div>
                        <span className="song-title">{item.name()}</span>
                        &nbsp;-&nbsp;
                        <span className="author-title">{item.artist()}</span>
                    </div>
                    <div className="album-title"><span>{item.album()}</span>{selectedItem !== item && <SelectPlaylistsView
                        className="chips-list" track={item} active={true} />}</div>
                </div>
                {!isBanned(item) && selectedItem === item && <SelectPlaylistsView
                    className="chips-list" track={item} />}
                <span className="badge-region">
                    {isBanned(item) ? <button className="badge badge-negative badge-outlined material-icons"
                        title="Banned, tap to remove Bann"
                        onClick={() => removeBannFromTrackCommand.exec(item)}
                    >block</button>
                        : <button className="badge badge-positive badge-outlined material-icons"
                            title="Allowed, tab to set a bann"
                            onClick={() => bannTrackCommand.exec(item)}
                        >done</button>}
                    {item.isLiked && <span className="badge badge-positive"
                        onClick={() => unlikeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                    {item.isLiked || <span className="badge"
                        onClick={() => likeTrackCommand.exec(item)}
                    >{item.duration()}</span>}
                </span>
            </div>
            {(trackLyrics && trackLyrics.trackId === item.id())
                && <div className="card">{trackLyrics.lyrics.split('\n').map((line, index) => {
                    return <div key={index}>{line}</div>;
                })}</div>}
        </li>
        )}
    </ul>;
};
