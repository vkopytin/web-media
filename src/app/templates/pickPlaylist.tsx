import * as React from 'react';
import * as _ from 'underscore';
import { PickPlaylistsView } from '../views';


export const template = (view: PickPlaylistsView) => <div className="chips-list">
    {_.map(view.playlists, (item: PickPlaylistsView['playlists'][0]) => {
        if (item && view.selectedPlaylist === item) {
            return <span className="chips chips-positive small" key={item.id()}
                onClick={() => view.selectPlaylistCommand.exec(null)}
            >
                {item.name()}
            </span>
        }
        return <span className="chips small" key={item.id()}
            onClick={() => view.selectPlaylistCommand.exec(item)}
        >
            {item.name()}
        </span>
    })}
</div>;
