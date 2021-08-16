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

home.get(
    '/manifest.json', [],
    (req: express.Request, res: express.Response) => {
        return res.json({
            "name": "Example App",
            "short_name": "ExApp",
            "theme_color": "#2196f3",
            "background_color": "#2196f3",
            "display": "standalone",
            "scope": "/",
            "start_url": "/",
            "icons": [
                {
                    "src": "icons/icon-72x72.png",
                    "sizes": "72x72",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-96x96.png",
                    "sizes": "96x96",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-128x128.png",
                    "sizes": "128x128",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-144x144.png",
                    "sizes": "144x144",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-152x152.png",
                    "sizes": "152x152",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-192x192.png",
                    "sizes": "192x192",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-384x384.png",
                    "sizes": "384x384",
                    "type": "image/png"
                },
                {
                    "src": "icons/icon-512x512.png",
                    "sizes": "512x512",
                    "type": "image/png"
                }
            ],
            "permissions": [
                "fileSystemProvider",
                "fileSystem"
            ]
        });
    }
);

export = home;
