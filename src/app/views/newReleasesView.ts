import * as React from 'react';
import { template } from '../templates/newReleases';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    NewReleasesViewModel,
    AlbumViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface INewReleasesViewProps {

}

class NewReleasesView extends withEvents(React.Component)<INewReleasesViewProps, {}> {
    state = {
        openLogin: false,
        releases: [] as AlbumViewModelItem[],
        currentAlbum: null as AlbumViewModelItem
    };
    
    selectAlbumCommand = {
        exec(album: AlbumViewModelItem) { }
    };

    binding = bindTo(this, () => current(NewReleasesViewModel), {
        'prop(releases)': 'newReleases',
        'prop(currentAlbum)': 'currentAlbum',
        'selectAlbumCommand': 'selectAlbumCommand',
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

    prop<K extends keyof NewReleasesView['state']>(propName: K, val?: NewReleasesView['state'][K]): NewReleasesView['state'][K] {
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

export { NewReleasesView };
