import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './sass/ratchet.scss';


const fromEntries = (str: string) => {
    const obj = {} as { [key: string]: string };
    str.replace(/([^=&]+)=([^&]*)/g, (m: unknown, key: string, value: string) => {
        return obj[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return obj;
};

if (
    !/state=onSpotify-123/.test(window.location.hash)
    && !/state=onGenius-123/.test(window.location.hash)
) {
    (async () => {
        const { AppView } = await import('./views/app');
        ReactDOM.render(
            React.createElement(AppView),
            document.getElementsByClassName('app-root')[0]
        );
    })();
} else if (/state=onSpotify-123/.test(window.location.hash)) {
    const authData = window.location.hash.replace(/^#/, '');
    const authInfo = fromEntries(authData) as {
        access_token: string;
        redirect_uri: string;
    };

    document.cookie = 'access_token=' + btoa(authInfo.access_token);
    if (window.parent !== window) {
        window.parent.postMessage(['accessToken', authInfo.access_token], '*');
    }
} else if (!/state=onGenius-123/.test(window.location.hash)) {

}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
