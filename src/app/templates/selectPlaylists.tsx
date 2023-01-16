import { utils } from 'databindjs';
import * as React from 'react';
import * as _ from 'underscore';
import { SelectPlaylistsView } from '../views';


const cn = utils.className;

export const template = (view: SelectPlaylistsView) => <div className={cn(`${view.props.className}`)}>
    {(view.isLoading && !view.props.active) ? <span className="chips chips-positive loading material-icons">refresh</span>
        : !view.props.active ? <span className="chips chips-positive material-icons">refresh</span>
            : null}
    {_.map(view.playlists, (item: SelectPlaylistsView['playlists'][0]) => {
        if (view.playlistHasTrack(item, view.props.track)) {
            return view.props.active
                ? <span className="chips chips-positive" key={item.id()}>{item.name()}</span>
                : <span className="chips chips-positive" key={item.id()}
                    onClick={() => view.removeFromPlaylistCommand.exec(view.props.track, item)}
                >
                    {item.name()}
                </span>
        }
        return view.props.active ? null : <span className="chips" key={item.id()}
            onClick={() => view.addToPlaylistCommand.exec(view.props.track, item)}
        >
            {item.name()}
        </span>
    })}
</div>;
