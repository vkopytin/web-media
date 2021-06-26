import $ = require('jquery');
import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/tracks';
import { Binding, current } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';

export interface ITracksViewProps {
    className?: string;
    playlist: PlaylistsViewModelItem;
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

function elementIndex(el) {
    const nodes = Array.prototype.slice.call(el.parentNode.childNodes);
    const index = nodes.indexOf(el);
    return index + 1;
}

class TracksView extends React.Component<ITracksViewProps, TracksView['state']> {
    vm = current(PlaylistsViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    likedTracks$ = this.vm.likedTracks$;
    @Binding likedTracks = this.likedTracks$.getValue();

    selectedItem$ = this.vm.selectedItem$;
    @Binding selectedItem = this.selectedItem$.getValue();

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding trackLyrics = this.trackLyrics$.getValue();

    state = {
        draggedIndex: 0,
        dragIndex: 0
    };

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding likeTrackCommand = this.likeTrackCommand$.getValue();

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding unlikeTrackCommand = this.unlikeTrackCommand$.getValue();

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding findTrackLyricsCommand = this.findTrackLyricsCommand$.getValue();

    reorderTrackCommand$ = this.vm.reorderTrackCommand$;
    @Binding reorderTrackCommand = this.reorderTrackCommand$.getValue();

    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    constructor(props) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    componentDidMount() {
        this.dispose$ = new Subject<void>();
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.likedTracks$.pipe(map(likedTracks => ({ likedTracks }))),
            this.selectedItem$.pipe(map(selectedItem => ({ selectedItem }))),
            this.trackLyrics$.pipe(map(trackLyrics => ({ trackLyrics }))),
            this.likedTracks$.pipe(map(likedTracks => ({ likedTracks }))),
            this.likeTrackCommand$.pipe(map(likeTrackCommand => ({ likeTrackCommand }))),
            this.unlikeTrackCommand$.pipe(map(unlikeTrackCommand => ({ unlikeTrackCommand }))),
            this.findTrackLyricsCommand$.pipe(map(findTrackLyricsCommand => ({ findTrackLyricsCommand }))),
            this.reorderTrackCommand$.pipe(map(reorderTrackCommand => ({ reorderTrackCommand }))),
        ).pipe(takeUntil(this.dispose$)).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
        this.errors$.pipe(
            takeUntil(this.dispose$),
            map(errors => this.showErrors(errors))
        ).subscribe();
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
    }

    uri() {
        return this.props.playlist.uri();
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }

    onMouseDown(e) {
        console.log('onMouseDown');
        const target = this.getTrNode(e.target);
        if (target) {
            target.setAttribute('draggable', true);
            target.ondragstart = this.onDragStart;
            target.ondragend = this.onDragEnd;
        }
    }
    
    onDragStart(e) {
        console.log('onDragStart');
        const target = this.getTrNode(e.target);
        if (target) {
            //       e.dataTransfer.setData('Text', '');
            e.dataTransfer.effectAllowed = 'move';
            console.log('target.parentElement:', target.parentElement);
            target.parentElement.ondragenter = e => this.onDragEnter(e, target);
            target.parentElement.ondragover = function (ev) {
                //         console.log('Tbody ondragover:',ev)
                //         ev.target.dataTransfer.effectAllowed = 'none'
                ev.preventDefault();
                return true;
            };
            target.parentElement.ondragleave = e => this.onDragLeave(e);
            const rowIndex = elementIndex(target);
            const dragIndex = rowIndex - 1;
            console.log('dragIndex:', dragIndex);
            this.state.dragIndex = dragIndex;
            this.state.draggedIndex = dragIndex;
        }
    }
    
    onDragEnter(e, el) {
        const target = this.getTrNode(e.target);
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

    onDragLeave(e) {
        const target = this.getTrNode(e.target);
        $(target).toggleClass('dragged-place', false);
    }
    
    onDragEnd(e) {
        console.log('onDragEnd');
        const target = this.getTrNode(e.target);
        if (target) {
            $(target).removeAttr('draggable');
            target.ondragstart = null;
            target.ondragend = null;
            target.parentElement.ondragenter = null;
            target.parentElement.ondragover = null;
            this.changeRowIndex();
            $('li', $(target).parent()).toggleClass('dragged-place', false);
        }
    }
    
    getTrNode(target) {
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
}

export { TracksView };

