import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'underscore';
import utils = require('../utils');

import { action, Controller, debugGroupAs, handler } from '../base/controller';


const asAsync = (asyncFn, ...args) => new Promise((resolve: (a: string) => void, reject) => {
    args.push((err, res) => {
        if (err) {
            reject(err);
        }
        resolve(res);
    });
    asyncFn.apply(this, args);
});

@handler('home')
class Home extends Controller {

    constructor(req, res, service) {
        super(req, res, service);
        this.request = req;
        this.response = res;
    }

    @action('index')
    @debugGroupAs('Serving index page from route (@request.route.path;)')
    async index(params) {

        this.Data = {
        };

        return this.view(this.Data);
    }
}

export { Home };
