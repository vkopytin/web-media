import $ from 'jquery';
import React from 'react';
import { template } from '../templates/tracks';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';

export interface ITracksViewProps {
    className?: string;
    playlist: PlaylistsViewModelItem;
    currentTrackId: string;
}

function elementIndex(el: HTMLElement) {
    const nodes = Array.prototype.slice.call(el.parentNode?.childNodes || []);
    const index = nodes.indexOf(el);
    return index + 1;
}

interface ITracksViewState {
    draggedIndex: number;
    dragIndex: number;
}

class TracksView extends React.Component<ITracksViewProps, ITracksViewState> {
    didRefresh: TracksView['refresh'] = this.refresh.bind(this);
    vm = inject(PlaylistsViewModel);

    state = {
        draggedIndex: 0,
        dragIndex: 0
    };

    @Binding((a: TracksView) => a.vm, 'errors')
    errors!: Result[];

    @Binding((a: TracksView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: TracksView) => a.vm, 'likedTracks')
    likedTracks!: TrackViewModelItem[];

    @Binding((a: TracksView) => a.vm, 'selectedItem')
    selectedItem!: TrackViewModelItem | null;

    @Binding((a: TracksView) => a.vm, 'bannedTrackIds')
    bannedTrackIds!: string[];

    @Binding((a: TracksView) => a.vm, 'trackLyrics')
    trackLyrics!: TracksView['vm']['trackLyrics'];

    @Binding((a: TracksView) => a.vm, 'likeTrackCommand')
    likeTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: TracksView) => a.vm, 'unlikeTrackCommand')
    unlikeTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: TracksView) => a.vm, 'findTrackLyricsCommand')
    findTrackLyricsCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: TracksView) => a.vm, 'reorderTrackCommand')
    reorderTrackCommand!: ICommand<TrackViewModelItem, TrackViewModelItem>;

    @Binding((a: TracksView) => a.vm, 'bannTrackCommand')
    bannTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: TracksView) => a.vm, 'removeBannFromTrackCommand')
    removeBannFromTrackCommand!: ICommand<TrackViewModelItem>;

    constructor(props: ITracksViewProps) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    uri(): string {
        return this.props.playlist.uri();
    }

    isPlaying(track: TrackViewModelItem): boolean {
        return track.id() === this.props.currentTrackId;
    }

    onMouseDown(e: React.MouseEvent<HTMLElement, MouseEvent> | React.TouchEvent<HTMLElement>): void {
        console.log('onMouseDown');
        const target = this.getTrNode(e.target as HTMLElement);
        if (target) {
            target.setAttribute('draggable', 'true');
            target.ondragstart = this.onDragStart;
            target.ondragend = this.onDragEnd;
        }
    }

    onDragStart(e: DragEvent): void {
        console.log('onDragStart');
        const target = this.getTrNode(e.target as HTMLElement);
        if (target) {
            //       e.dataTransfer.setData('Text', '');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
            console.log('target.parentElement:', target.parentElement);
            if (target.parentElement) {
                target.parentElement.ondragenter = e => this.onDragEnter(e, target);
                target.parentElement.ondragover = function (ev) {
                    //         console.log('Tbody ondragover:',ev)
                    //         ev.target.dataTransfer.effectAllowed = 'none'
                    ev.preventDefault();
                    return true;
                };
                target.parentElement.ondragleave = e => this.onDragLeave(e);
            }
            const rowIndex = elementIndex(target);
            const dragIndex = rowIndex - 1;
            console.log('dragIndex:', dragIndex);
            this.state.dragIndex = dragIndex;
            this.state.draggedIndex = dragIndex;
        }
    }

    onDragEnter(e: Event, el: HTMLElement): void {
        const target = this.getTrNode(e.target as HTMLElement);
        $(target).toggleClass('dragged-place', true);
        const rowIndex = elementIndex(target);
        console.log('onDragEnter TR index:', rowIndex - 1);
        this.state.draggedIndex = target ? rowIndex - 1 : -1;
        if (this.state.dragIndex > this.state.draggedIndex) {
            $(el).insertBefore(target);
        } else {
            $(el).insertAfter(target);
        }
    }

    onDragLeave(e: Event): void {
        const target = this.getTrNode(e.target as HTMLElement);
        $(target).toggleClass('dragged-place', false);
    }

    onDragEnd(e: DragEvent): void {
        console.log('onDragEnd');
        const target = this.getTrNode(e.target as HTMLElement);
        if (target) {
            $(target).removeAttr('draggable');
            target.ondragstart = null;
            target.ondragend = null;
            if (target.parentElement) {
                target.parentElement.ondragenter = null;
                target.parentElement.ondragover = null;
            }
            this.changeRowIndex();
            $('li', $(target).parent()).toggleClass('dragged-place', false);
        }
    }

    getTrNode(target: HTMLElement) {
        //     console.log('dragContainer:', this.refs.dragContainer)
        //     return closest(target, 'tr', this.refs.dragContainer.tableNode);
        return $(target).closest('li')[0];
    }

    changeRowIndex(): void {
        const dragIndex = this.state.dragIndex;
        const draggedIndex = this.state.draggedIndex;
        if (
            dragIndex >= 0 &&
            dragIndex !== draggedIndex
        ) {
            this.reorderTrackCommand.exec(this.tracks[dragIndex], this.tracks[draggedIndex]);
        }
        this.state.dragIndex = -1;
        this.state.draggedIndex = -1;
    }

    isBanned(track: TrackViewModelItem): boolean {
        const res = this.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }

    render() {
        return template(this);
    }
}

export { TracksView };

