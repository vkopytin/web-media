import * as _ from 'underscore';
import * as React from 'react';
import { utils } from 'databindjs';
import { SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: SelectPlaylistsView) => <div>
    {_.map(view.prop('items'), (item) => {
        return <span className={cn("badge ?badge-positive", view.playlistHasTrack(item, view.prop('track')))} key={item.id()}
            onClick={evnt => view.addToPlaylist(item)}
        >
            {item.name()}
        </span>
    })}
</div>;
