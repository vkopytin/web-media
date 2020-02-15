import * as express from 'express';
import * as _ from 'underscore';

import * as controllers from '../controllers';
import {
    endsWithSlash,
    HTML_ACCEPTED
} from './filters';
import { handler } from './handler';

const home = express.Router();
const filters = [];


home.get(
    '/index', [HTML_ACCEPTED, ...filters],
    handler(controllers.Home, h => h.index)
);

export = home;
