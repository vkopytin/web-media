import { DataStorage } from '../dataStorage';
import { TrackData } from '../entities/trackData';


export function openTracks(cb: { (tracks: TrackData): void }) {
    DataStorage.create((err, connection) => {
            
        cb(new TrackData(connection));

        connection.complete();
    });
}
