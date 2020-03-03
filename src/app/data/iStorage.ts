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
	initializeStructure(cb: { (err, res?): void });
    createTable(config: IStorageConfig, cb: { (err, res?): void });
    getById(config: IStorageConfig, id, cb: { (err?, id?): void });
    each(config: IStorageConfig, cb: { (err?, record?, index?: number): boolean });
    create(config: IStorageConfig, data: { [key: string]: any, id; }, cb: { (err, res?): void });
    update(config: IStorageConfig, id, data, cb: { (err, res?): void });
    delete(config: IStorageConfig, id, cb: { (err, result?): void });
    getCount(config: IStorageConfig, cb: { (err, res?): void });
	complete();
}
