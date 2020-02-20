import * as React from 'react';
import { template } from '../templates/tracks';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    PlaylistsViewModel,
    TrackViewModelItem,
    PlaylistsViewModelItem,
    AlbumViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface ITracksViewProps {
    playlist: PlaylistsViewModelItem;
}

class TracksView extends withEvents(React.Component)<ITracksViewProps, {}> {
    state = {
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
    };
    binding = bindTo(this, () => current(PlaylistsViewModel), {
        'prop(tracks)': 'tracks'
    });

    constructor(props) {
        super(props);
        subscribeToChange(this.binding, () => {
            this.setState({
                ...this.state
            });
        });
    }

    componentDidMount() {
        updateLayout(this.binding);
    }

    componentWillUnmount() {
        unbindFrom(this.binding);
    }

    prop<K extends keyof TracksView['state']>(propName: K, val?: TracksView['state'][K]): TracksView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    uri() {
        return this.props.playlist.uri();
    }

    render() {
        return template(this);
    }
}

export { TracksView };
