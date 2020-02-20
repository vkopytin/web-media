import * as React from 'react';
import { AppView } from './views/app';
import * as ReactDOM from 'react-dom';
import './sass/theme-ios.scss';
import './sass/ratchet.scss';
import './sass/player.scss';


ReactDOM.render(
    React.createElement(AppView),
    document.getElementsByClassName('app-root')[0]
);
