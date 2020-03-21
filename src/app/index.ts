import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './sass/ratchet.scss';


if (!/state=123/.test(window.location.hash)) {
    (async () => {
        const { AppView } = await import('./views/app');
        ReactDOM.render(
            React.createElement(AppView),
            document.getElementsByClassName('app-root')[0]
        );
    })();
} else {
    const fromEntries = str => {
        const obj = {};
        str.replace(/([^=&]+)=([^&]*)/g, function (m, key, value) {
            obj[decodeURIComponent(key)] = decodeURIComponent(value);
        });

        return obj;
    };

    const authData = window.location.hash.replace(/^#/, '');
    const authInfo = fromEntries(authData) as {
        access_token: string;
        redirect_uri: string;
    };

    document.cookie = 'access_token=' + btoa(authInfo.access_token);
    if (window.parent !== window) {
        window.parent.postMessage(['accessToken', authInfo.access_token], '*');
    }
}
