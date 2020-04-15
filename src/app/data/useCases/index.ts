import * as _ from 'underscore';
import { DataStorage } from '../dataStorage';
import { asAsync } from '../../utils';
import { RecordsStore } from '../entities/recordsStore';


export function initializeStructure() {
    return asAsync(() => { }, cb => {
        DataStorage.create((err, storage) => {
            const recordsStore = new RecordsStore(storage);
            storage.initializeStructure(async (err, isInitializing) => {
                try {
                    if (!isInitializing) {
                        return cb(null);
                    }
                    await recordsStore.createTable();
                    cb(null, true);
                } catch (ex) {
                    cb(ex);
                }
            });
        });
    });
}
