import { PlaylistsView } from '../views/playlistsView';
import { TracksView } from '../views/tracksView';

export const template = (view: PlaylistsView) => <>
    <form onSubmit={e => e.preventDefault()}>
        <input
            type="text"
            placeholder="Enter new playlist name..."
            defaultValue={view.newPlaylistName}
            onChange={evnt => view.newPlaylistName = evnt.target.value}
        />
    </form>
    <div className="segmented-control">
        <a className="control-item active btn-primary" href="#create-public"
            onClick={evnt => { evnt.preventDefault(); view.createPlaylistCommand.exec(true); }}
        >Create public</a>
        <a className="control-item btn-outlined btn-primary" href="#crate-private"
            onClick={evnt => { evnt.preventDefault(); view.createPlaylistCommand.exec(false); }}
        >Create private</a>
    </div>
    <ul className="table-view">
        {view.playlists.map((item: PlaylistsView['playlists'][0]) => {
            return <li key={item.id()}>
                <div className="table-view-cell media">
                    <a className="navigate-right"
                        onClick={() => { view.selectPlaylistCommand.exec(item.id() === view.currentPlaylistId ? null : item.id()) }}
                    >
                        <img className="media-object pull-left" height="60" src={item.thumbnailUrl()} alt={item.name()} />
                        <div className="media-body">
                            {item.name()}
                            <p>{item.owner()}</p>
                        </div>
                        <span className="badge">{item.tracksTotal()}</span>
                    </a>
                </div>
                {item.id() === view.currentPlaylistId && <div className="card">
                    <TracksView
                        className="tracks-list"
                        key={view.props.currentTrackId}
                        playlist={item}
                        currentTrackId={view.props.currentTrackId}
                    />
                    <div key={2} className="center">
                        {view.isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
                            onClick={() => view.loadMoreTracksCommand.exec()}
                        ></button>}
                        {view.isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
                    </div>
                </div>}
            </li>
        })}
    </ul>
    <div className="center">
        {view.isLoading || <button className="button-round btn btn-primary btn-block btn-outlined icon icon icon-down"
            onClick={() => view.loadMoreCommand.exec()}
        ></button>}
        {view.isLoading && <button className="loading button-round btn btn-primary btn-block btn-outlined icon icon icon-refresh"></button>}
    </div>
    <footer className="info content-padded">
        <p>Media Player</p>
        <p>Written by <a href="https://github.com/vkopytin">Volodymyr Kopytin</a></p>
        <p>Powered by <a href="https://www.npmjs.com/package/databindjs">DataBind JS</a></p>
    </footer>
</>;
