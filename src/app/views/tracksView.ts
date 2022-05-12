import $ = require('jquery');
import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/tracks';
import { Binding, current, Notify } from '../utils';
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

interface ITracksViewState {
    draggedIndex: number;
    dragIndex: number;
}

class TracksView extends React.Component<ITracksViewProps, ITracksViewState> {
    didRefresh: TracksView['refresh'] = () => { };
    vm = current(PlaylistsViewModel);
    
    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: TracksView['vm']['errors'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: TracksView['vm']['tracks'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likedTracks: TracksView['vm']['likedTracks'];

    selectedItem$ = this.vm.selectedItem$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectedItem: TracksView['vm']['selectedItem'];

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding({ didSet: (view) => view.didRefresh() })
    trackLyrics: TracksView['vm']['trackLyrics'];

    bannedTrackIds$ = this.vm.bannedTrackIds$;
    @Binding({ didSet: (view) => view.didRefresh() })
    bannedTrackIds: TracksView['vm']['bannedTrackIds'];

    state = {
        draggedIndex: 0,
        dragIndex: 0
    };

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likeTrackCommand: TracksView['vm']['likeTrackCommand'];

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    unlikeTrackCommand: TracksView['vm']['unlikeTrackCommand'];

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    findTrackLyricsCommand: TracksView['vm']['findTrackLyricsCommand'];

    reorderTrackCommand$ = this.vm.reorderTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    reorderTrackCommand: TracksView['vm']['reorderTrackCommand'];

    bannTrackCommand$ = this.vm.bannTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    bannTrackCommand: TracksView['vm']['bannTrackCommand'];

    removeBannFromTrackCommand$ = this.vm.removeBannFromTrackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    removeBannFromTrackCommand: TracksView['vm']['removeBannFromTrackCommand'];

    constructor(props) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
    }

    refresh(args) {
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

    isBanned(track: TrackViewModelItem) {
        const res = this.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }
}

export { TracksView };

