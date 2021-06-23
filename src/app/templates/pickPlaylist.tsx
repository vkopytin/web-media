import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { PickPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: PickPlaylistsView) => <div className="chips-list">
    {_.map(view.playlists, (item: PickPlaylistsView['playlists'][0]) => {
        if (item && view.selectedPlaylist === item) {
            return <span className="chips chips-positive" key={item.id()}
                onClick={evnt => view.selectedPlaylist = null}
            >
                {item.name()}
            </span>
        }
        return <span className="chips" key={item.id()}
            onClick={evnt => view.selectedPlaylist = item}
        >
            {item.name()}
        </span>
    })}
</div>;
