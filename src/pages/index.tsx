import { useEffect, useState } from 'react';
import { current } from '../app/utils';
import { Core } from '../app/viewModels/core';
import { AppView } from '../app/views/app';

const core = current(Core);

export default function HomePage() {
  const [isSsr, setIsSsr] = useState(true);
  useEffect(() => {
    core.run();
    setIsSsr(false);
  }, []);

  return isSsr ? <div></div> : <AppView></AppView>;
}
