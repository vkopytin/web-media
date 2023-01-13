import * as _ from 'underscore';
import { IStorage, IStorageConfig } from './iStorage';


class RemoteStorage implements IStorage {
    constructor(public connection: string | null) {
    }

    initializeStructure(cb: { (err?: Error | null, res?: boolean): void }): void {
        cb(null, false);
    }

    hasTable(config: IStorageConfig, cb: { (err: Error | null, res?: boolean): void }) {
        cb(null, false);
    }

    createTable(config: IStorageConfig, cb: { (err: Error | null, res?: boolean): void }) {
        try {
            cb(null, false);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    create<T>(config: IStorageConfig, data: { id: unknown; }, cb: { (err: Error | null, res?: T | null): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    update<T>(config: IStorageConfig, id: unknown, data: {}, cb: { (err: Error | null, res?: T | null): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex as Error, null);
        }

        return true;
    }

    delete(config: IStorageConfig, id: string, cb: { (err: Error | null, result?: boolean): void }) {
        try {
            cb(null, false);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    getById<T>(config: IStorageConfig, id: string, cb: { (err: Error | null, res?: T | null): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    where<T>(config: IStorageConfig, where: { [key: string]: any }, cb: { (err?: Error, result?: T): boolean }): void {

    }

    each<T>(config: IStorageConfig, cb: { (err?: Error, record?: T, index?: number): boolean }): boolean {
        let index = 0;

        cb();

        return true;
    }

    getCount(config: IStorageConfig, cb: { (err: Error | null, res?: number): void }): void {
        try {
            let count = 0;

            cb(null, count);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    complete() {

    }
}

export { RemoteStorage };
