import * as _ from 'underscore';
import { IUserPlaylist } from '../adapter/spotify';


function unsafeHtml(html: string) {
    const el = document.createElement('div');
    el.innerHTML = html;

    const els = el.getElementsByTagName('script');
    for (let el of [].slice.call(els, 0)) {
        el.parentElement?.removeChild(el);
    }

    return el.innerHTML;
}

class PlaylistsViewModelItem {
    constructor(public playlist: IUserPlaylist) {
    }

    id() {
        return this.playlist.id;
    }

    uri() {
        return this.playlist.uri;
    }

    name() {
        return this.playlist.name;
    }

    owner() {
        return this.playlist.owner.display_name;
    }

    ownerUrl() {
        return this.playlist.owner.href;
    }

    tracksTotal() {
        return this.playlist.tracks.total;
    }

    description() {
        return unsafeHtml(this.playlist.description || '');
    }

    thumbnailUrl() {
        return _.first(this.playlist.images)?.url;
    }

    snapshotId() {
        return this.playlist.snapshot_id;
    }

    equals(inst: PlaylistsViewModelItem) {
        if (inst == null || inst == undefined) {
            return false;
        }

        if (this === inst) {
            return true;
        }

        if (!(inst instanceof PlaylistsViewModelItem)) {
            return false;
        }

        return this.playlist.id === inst.playlist.id;
    }
}

export { PlaylistsViewModelItem };

