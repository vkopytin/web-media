export interface IStorageConfig {
    name: string;
    options: {
        keyPath: string;
        autoIncrement?: boolean;
    };
    index?: {
        [key: string]: {
            [key: string]: {
                unique?: boolean;
            };
        };
    };
    orderBy?: string;
    orderDesk?: boolean;
}

export interface IStorage {
    initializeStructure(cb: { (err: Error, res?: unknown): void }): void;
    hasTable(config: IStorageConfig, cb: { (err: Error, res?: unknown): void }): void;
    createTable(config: IStorageConfig, cb: { (err: Error, res?: unknown): void }): void;
    getById<T>(config: IStorageConfig, id: unknown, cb: { (err?: unknown, res?: T): void }): void;
    where<T>(config: IStorageConfig, where: { [key: string]: any }, cb: { (err?: unknown, result?: T): boolean }): void;
    each<T = {}>(config: IStorageConfig, cb: { (err?: unknown, record?: T, index?: number): boolean }): void;
    create(config: IStorageConfig, data: { [key: string]: any, id?: unknown; }, cb: { (err: unknown, res?: unknown): void }): void;
    update<T>(config: IStorageConfig, id: unknown, data: {}, cb: { (err: unknown, res?: T): void }): void;
    delete(config: IStorageConfig, id: unknown, cb: { (err: unknown, result?: boolean): void }): void;
    getCount(config: IStorageConfig, cb: { (err: unknown, res?: number): void }): void;
    complete(): void;
}
