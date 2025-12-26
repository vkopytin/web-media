import { SPOTIFY_ACCESS_TOKEN_KEY } from '../app/consts';
import type { AppProps } from 'next/app'

import '../global.scss';

let authenticating = false;

const fromEntries = (str: string) => {
  const obj: { [key: string]: string } = {};
  str.replace(/([^=&]+)=([^&]*)/g, function (m, key, value): string {
    obj[decodeURIComponent(key)] = decodeURIComponent(value);
    return '';
  });

  return obj;
};

if (typeof window !== 'undefined') {
  const authData = window.location.search.replace(/^\?/, '');
  const authInfo = fromEntries(authData) as {
    code: string;
    state: string;
  };
  const codeVerifier = authInfo.state?.replace('onSpotify-', '');
  const clientId = localStorage.getItem('client_id');
  fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId || '',
        grant_type: 'authorization_code',
        code: authInfo.code,
        redirect_uri: `${window.location.protocol}//${window.location.host}/`,
        code_verifier: codeVerifier || '',
      })
    })
    .then(res => res.json())
    .then((authInfo: { access_token?: string; refresh_token?: string; }) => {
      if ('access_token' in authInfo && authInfo.access_token) {
        console.log('finishing authentication...');
        document.cookie = [SPOTIFY_ACCESS_TOKEN_KEY, btoa(authInfo.access_token)].join('=');
        if (window.parent !== window) {
          authenticating = true;
          window.parent.postMessage(['accessToken', authInfo.access_token], '*');
        }
        window.location.replace(window.location.pathname);
      }
      if ('refresh_token' in authInfo && authInfo.refresh_token) {
        localStorage.setItem('refresh_token', authInfo.refresh_token);
      }
    });
}

export default function MyApp({ Component, pageProps }: AppProps) {
  if (authenticating) {
    return <div>Authenticating frame...</div>;
  }
  return <Component {...pageProps} />;
}
