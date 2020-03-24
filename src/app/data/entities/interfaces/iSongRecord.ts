import { ITrackRecord } from './iTrackRecord';


export interface ISongRecord {
    track: ITrackRecord;
    added_at: string;
    snapshot_id?: string;
}
