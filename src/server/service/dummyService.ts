import { RMService } from "./connections";
import { DummyUnexpectedError } from "./errors/unexpected_error";
import { DummyResult } from "./results/dummy_result";
import { BaseService } from "../base/service";


class DummyService extends BaseService {
    static async create(connection: RMService) {
        try {
            return DummyResult.success(new DummyService());
        } catch (ex) {
            return DummyUnexpectedError.create('Unexpected dummer error', ex);
        }
    }
}

export { DummyService };
