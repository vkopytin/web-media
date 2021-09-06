import { IPlaylist } from './iPlaylist';
import { ITrack } from './iTrack';

export interface IPlaylistRow {
    id: string;
    playlist: IPlaylist;
    playlistId: string;
    added_at?: string;
    added_by?: {};
    is_local?: boolean;
    primary_color?: string;
    track: ITrack;
    trackId: string;
    video_thumbnail?: {
        url: string;
    }
};
