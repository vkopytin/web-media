import * as _ from 'underscore';
import { IUserPlaylist } from '../adapter/spotify';


function unsafeHtml(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;

    const elements = div.getElementsByTagName('script');
    for (const element of ([] as HTMLScriptElement[]).slice.call(elements, 0)) {
        element.parentElement?.removeChild(element);
    }

    return div.innerHTML;
}

class PlaylistsViewModelItem {
    constructor(public playlist: IUserPlaylist) {
    }

    id(): string {
        return this.playlist.id;
    }

    uri(): string {
        return this.playlist.uri;
    }

    name(): string {
        return this.playlist.name;
    }

    owner(): string {
        return this.playlist.owner.display_name || '';
    }

    ownerUrl(): string {
        return this.playlist.owner.href || '';
    }

    tracksTotal(): number {
        return this.playlist.tracks.total;
    }

    description(): string {
        return unsafeHtml(this.playlist.description || '');
    }

    thumbnailUrl(): string {
        return _.first(this.playlist.images)?.url || '';
    }

    snapshotId(): string {
        return this.playlist.snapshot_id;
    }

    equals(inst: PlaylistsViewModelItem): boolean {
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

