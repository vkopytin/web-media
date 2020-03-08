import * as _ from 'underscore';
import * as React from 'react';
import { utils } from 'databindjs';
import { PickPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: PickPlaylistsView) => <div className="chips-list">
    {_.map(view.prop('items'), (item) => {
        if (item, view.prop('selectedPlaylist') === item) {
            return <span className="chips chips-positive" key={item.id()}
                onClick={evnt => view.prop('selectedPlaylist', null)}
            >
                {item.name()}
            </span>
        }
        return <span className="chips" key={item.id()}
            onClick={evnt => view.prop('selectedPlaylist', item)}
        >
            {item.name()}
        </span>
    })}
</div>;
