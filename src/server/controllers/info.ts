import { action, Controller, handler } from '../base/controller';


@handler('info')
class Info extends Controller {
    constructor(req, res) {
        super(req, res, null);

        this.request = req;
        this.response = res;

    }

    @action('healthz')
    async healthz() {
        return this.json({});
    }
}

export { Info };
