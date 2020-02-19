import * as React from 'react';
import { template } from '../templates/tracks';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import { ProfileViewModel } from '../viewModels/profileViewModel';
import { TrackViewModelItem } from '../viewModels/trackViewModelItem';
import { current } from '../utils';
import { PlaylistViewModelItem } from '../viewModels/playlistViewModelItem';


export interface ITracksViewProps {
    playlist: PlaylistViewModelItem;
}

class TracksView extends withEvents(React.Component)<ITracksViewProps, {}> {
    state = {
        openLogin: false,
        tracks: [] as TrackViewModelItem[]
    };
    binding = bindTo(this, () => current(ProfileViewModel), {
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

    render() {
        return template(this);
    }
}

export { TracksView };
