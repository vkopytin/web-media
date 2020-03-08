import { IUserRecord } from './iUserRecord';
import { IImageRecord } from './iImageRecord';


export interface IPlaylistRecord {
    id: string;
    name: string;
    uri: string;
    tracks: {
        total: number;
    };
    images: Array<IImageRecord>;
    owner: IUserRecord;
    snapshot_id: string;
}
