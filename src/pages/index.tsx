import { useEffect, useState } from 'react';
import { inject } from '../app/utils/inject';
import { Core } from '../app/core';
import { AppView } from '../app/views/app';

const core = inject(Core);

export default function HomePage() {
  useEffect(() => {
    core.run();
  }, []);

  return <AppView></AppView>;
}

export function HomePageSsrOff() {
  const [isSsr, setIsSsr] = useState(true);
  useEffect(() => {
    core.run();
    setIsSsr(false);
  }, []);

  return isSsr ? <div></div> : <AppView></AppView>;
}
