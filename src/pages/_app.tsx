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
  const authData = window.location.hash.replace(/^#/, '');
  const authInfo = fromEntries(authData) as {
    access_token: string;
    redirect_uri: string;
  };

  if ('access_token' in authInfo && authInfo.access_token) {
    console.log('finishing authentication...');
    document.cookie = 'access_token=' + btoa(authInfo.access_token);
    if (window.parent !== window) {
      authenticating = true;
      window.parent.postMessage(['accessToken', authInfo.access_token], '*');
    }
    window.location.replace(window.location.pathname);
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  if (authenticating) {
    return <div>Authenticating frame...</div>;
  }
  return <Component {...pageProps} />;
}
