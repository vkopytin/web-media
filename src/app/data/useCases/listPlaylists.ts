import { PlaylistData } from '../entities/playlistData';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import * as _ from 'underscore';
import { utils } from 'databindjs';
import { IUserPlaylist } from '../../service/adapter/spotify';


export function listPlaylists(offset = 0, limit = 0) {
    return asAsync<IUserPlaylist[]>(null, (cb: { (a, b): void }) => {
        DataStorage.create(async (err, connection) => {
            const playlists = new PlaylistData(connection);
            const queue = utils.asyncQueue();
            const subQueue = utils.asyncQueue(30);
            const items = [] as IUserPlaylist[];

            queue.push(next => {
                playlists.each((err, result, index) => {
                    if (index < offset) {
                        return;
                    }
                    if (index > offset + limit) {
                        return;
                    }
                    if (_.isUndefined(result)) {
                        next();
                        return true;
                    }
                    subQueue.push(next => {
                        items.push(result);
                        next();
                    });
                });
            });
            queue.push(next => {
                cb(null, items);
                next();
            });
        });
    });
}
