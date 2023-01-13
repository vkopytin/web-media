import $ = require('jquery');
import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/tracks';
import { Binding, current, Notifications } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';

export interface ITracksViewProps {
    className?: string;
    playlist: PlaylistsViewModelItem;
    currentTrackId: string;
    showErrors<T>(errors: ServiceResult<T, Error>[]): void;
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
    vm = current(PlaylistsViewModel);

    state = {
        draggedIndex: 0,
        dragIndex: 0
    };

    errors$ = this.vm.errors$;
    @Binding<TracksView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: TracksView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: TracksView['vm']['tracks'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding()
    likedTracks!: TracksView['vm']['likedTracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding()
    selectedItem!: TracksView['vm']['selectedItem'];

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding()
    trackLyrics!: TracksView['vm']['trackLyrics'];

    bannedTrackIds$ = this.vm.bannedTrackIds$;
    @Binding()
    bannedTrackIds!: TracksView['vm']['bannedTrackIds'];

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding()
    likeTrackCommand!: TracksView['vm']['likeTrackCommand'];

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding()
    unlikeTrackCommand!: TracksView['vm']['unlikeTrackCommand'];

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding()
    findTrackLyricsCommand!: TracksView['vm']['findTrackLyricsCommand'];

    reorderTrackCommand$ = this.vm.reorderTrackCommand$;
    @Binding()
    reorderTrackCommand!: TracksView['vm']['reorderTrackCommand'];

    bannTrackCommand$ = this.vm.bannTrackCommand$;
    @Binding()
    bannTrackCommand!: TracksView['vm']['bannTrackCommand'];

    removeBannFromTrackCommand$ = this.vm.removeBannFromTrackCommand$;
    @Binding()
    removeBannFromTrackCommand!: TracksView['vm']['removeBannFromTrackCommand'];

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

    refresh(args: { inst: unknown; value: ServiceResult<unknown, Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    uri() {
        return this.props.playlist.uri();
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    showErrors(errors: ServiceResult<unknown, Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }

    onMouseDown(e: React.MouseEvent<HTMLElement, MouseEvent> | React.TouchEvent<HTMLElement>) {
        console.log('onMouseDown');
        const target = this.getTrNode(e.target as HTMLElement);
        if (target) {
            target.setAttribute('draggable', 'true');
            target.ondragstart = this.onDragStart;
            target.ondragend = this.onDragEnd;
        }
    }

    onDragStart(e: DragEvent) {
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

    onDragEnter(e: Event, el: HTMLElement) {
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

    onDragLeave(e: Event) {
        const target = this.getTrNode(e.target as HTMLElement);
        $(target).toggleClass('dragged-place', false);
    }

    onDragEnd(e: DragEvent) {
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

    changeRowIndex() {
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

    isBanned(track: TrackViewModelItem) {
        const res = this.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }
}

export { TracksView };

