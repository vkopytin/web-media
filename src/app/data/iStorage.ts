export interface IStorage {
	initializeStructure(cb: { (err, res?): void });
    createTable(tableName, cb: { (err, res?): void });
    getById(tableName: string, id, cb: { (err?, id?): void });
    each(tableName: string, cb: { (err?, record?, index?: number): boolean });
    create(tableName: string, data: { id; }, cb: { (err, res?): void });
    update(tableName: string, id, data, cb: { (err, res?): void });
    delete(tableName: string, id, cb: { (err, result?): void });
    getCount(tableName, cb: { (err, res?): void });
	complete();
}
