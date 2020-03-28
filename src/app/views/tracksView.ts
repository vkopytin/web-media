import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import $ from 'jquery';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/tracks';
import { current } from '../utils';
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

class TracksView extends BaseView<ITracksViewProps, TracksView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
        likedTracks: [] as TrackViewModelItem[],
        selectedItem: null as TrackViewModelItem,
        trackLyrics: null as { trackId: string; lyrics: string },
        draggedIndex: 0,
        dragIndex: 0
    };

    likeTrackCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };
    unlikeTrackCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };
    findTrackLyricsCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };
    reorderTrackCommand = { exec(track: TrackViewModelItem, beforeTrack: TrackViewModelItem) { throw new Error('Not bound command') } };

    binding = bindTo(this, () => current(PlaylistsViewModel), {
        'findTrackLyricsCommand': 'findTrackLyricsCommand',
        'likeTrackCommand': 'likeTrackCommand',
        'unlikeTrackCommand': 'unlikeTrackCommand',
        'reorderTrackCommand': 'reorderTrackCommand',
        'prop(tracks)': 'tracks',
        'prop(likedTracks)': 'likedTracks',
        'prop(selectedItem)': 'selectedItem',
        'prop(trackLyrics)': 'prop(trackLyrics)'
    });

    constructor(props) {
        super(props);
        subscribeToChange(this.binding, () => {
            this.setState({
                ...this.state
            });
        });

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    componentDidMount() {
        updateLayout(this.binding);
    }

    componentWillUnmount() {
        unbindFrom(this.binding);
    }

    uri() {
        return this.props.playlist.uri();
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.prop('errors')) {
            this.prop('errors', val);
            this.props.showErrors(val);
        }

        return this.prop('errors');
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
            this.prop('dragIndex', dragIndex);
            this.prop('draggedIndex', dragIndex);
        }
    }
    
    onDragEnter(e, el) {
        const target = this.getTrNode(e.target);
        $(target).toggleClass('dragged-place', true);
        const rowIndex = elementIndex(target);
        console.log('onDragEnter TR index:', rowIndex - 1);
        this.prop('draggedIndex', target ? rowIndex - 1 : -1);
        if (this.prop('dragIndex') > this.prop('draggedIndex')) {
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
        const dragIndex = this.prop('dragIndex');
        const draggedIndex = this.prop('draggedIndex');
        if (
            dragIndex >= 0 &&
            dragIndex !== draggedIndex
        ) {
            this.reorderTrackCommand.exec(this.prop('tracks')[dragIndex], this.prop('tracks')[draggedIndex]);
        }
        this.prop('dragIndex', -1);
        this.prop('draggedIndex', -1);
    }
}

export { TracksView };

