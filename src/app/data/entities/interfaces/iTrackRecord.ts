import { IArtistRecord } from './iArtistRecord';
import { IAlbumRecord } from './iAlbumRecord';


export interface ITrackRecord {
    id: string;
    name: string;
    album: IAlbumRecord;
    artists: IArtistRecord[];
    uri: string;
    duration_ms: number;
    track_number: number;
}
