import * as express from 'express';
import * as controllers from '../controllers';
import { handler } from './handler';


const info = express.Router();

info.get(
    '*/healthz/?$', [],
    handler(controllers.Info, h => h.healthz)
);

export = info;
