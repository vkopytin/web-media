import * as React from 'react';
import { AppView } from './views/app';
import * as ReactDOM from 'react-dom';
import './sass/player.scss';
import './sass/theme-ios.scss';
import './sass/ratchet.scss';


ReactDOM.render(
    React.createElement(AppView),
    document.getElementsByClassName('app-root')[0]
);
