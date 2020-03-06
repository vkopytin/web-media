import * as _ from 'underscore';
import * as React from 'react';
import { utils } from 'databindjs';
import { SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: SelectPlaylistsView) => <div>
    {_.map(view.prop('items'), (item) => {
        return view.playlistHasTrack(item, view.prop('track')) && <span className="badge badge-positive" key={item.id()}
            onClick={evnt => {
                view.removeFromPlaylistCommand.exec(view.prop('track'), item);
                setTimeout(() => view.fetchData(), 1000);
            }}
        >
            {item.name()}
        </span> || <span className="badge" key={item.id()}
            onClick={evnt => {
                view.addToPlaylistCommand.exec(view.prop('track'), item);
            }}
        >
                {item.name()}
            </span>
    })}
</div>;
