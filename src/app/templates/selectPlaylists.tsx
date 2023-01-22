import * as _ from 'underscore';
import { className as cn } from '../utils';
import { SelectPlaylistsView } from '../views';

export const template = (view: SelectPlaylistsView) => <div className={cn(`${view.props.className}`)}>
    {(view.isLoading && !view.props.active) ? <span className="chips chips-positive small loading material-icons">refresh</span>
        : !view.props.active ? <span className="chips chips-positive material-icons">refresh</span>
            : null}
    {_.map(view.playlists, (item: SelectPlaylistsView['playlists'][0]) => {
        if (view.isPlaylistInTracksPlaylist(item)) {
            return view.props.active
                ? <span className="chips chips-positive small" key={item.id()}>{item.name()}</span>
                : <span className="chips chips-positive small" key={item.id()}
                    onClick={() => view.removeFromPlaylistCommand.exec(view.props.track, item)}
                >
                    {item.name()}
                </span>
        }
        return view.props.active ? null : <span className="chips small" key={item.id()}
            onClick={() => view.addToPlaylistCommand.exec(view.props.track, item)}
        >
            {item.name()}
        </span>
    })}
</div>;
