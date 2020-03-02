import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import * as _ from 'underscore';
import { utils } from 'databindjs';
import { MyLibraryData } from '../entities/myLibraryData';


export function isLiked(trackId: string) {
    return new Promise<boolean>((resolve, reject) => {
        DataStorage.create(async (err, connection) => {
            const myLibrary = new MyLibraryData(connection);

            myLibrary.getById('track:' + trackId, (err, result) => {
                if (err) {
                    return reject(err);
                }
                if (result && result.trackId === trackId) {
                    resolve(result.isLiked);
                    return false;
                }
                resolve(null);
            });
        });
    });
}
