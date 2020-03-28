import { ITrackRecord } from './iTrackRecord';

export interface IPlaylistTrackRecord {
    track: ITrackRecord;
    added_at: string;
    position?: number;
}
