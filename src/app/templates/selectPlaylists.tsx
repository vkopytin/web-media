import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: SelectPlaylistsView) => <div className={cn(`${view.props.className}`)}>
    {_.map(view.prop('items'), (item) => {
        if (view.playlistHasTrack(item, view.prop('track'))) {
            return view.props.active
                ? <span className="chips chips-positive" key={item.id()}>{item.name()}</span>
                : <span className="chips chips-positive" key={item.id()}
                    onClick={evnt => view.removeFromPlaylistCommand.exec(view.prop('track'), item)}
                >
                    {item.name()}
                </span>
        }
        return view.props.active ? null : <span className="chips" key={item.id()}
            onClick={evnt => view.addToPlaylistCommand.exec(view.prop('track'), item)}
        >
            {item.name()}
        </span>
    })}
</div>;
