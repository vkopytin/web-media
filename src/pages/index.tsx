import { useEffect } from 'react';
import { current } from '../app/utils';
import { Core } from '../app/viewModels/core';
import { AppView } from '../app/views/app';

const core = current(Core);

export default function HomePage() {
  useEffect(() => {
    core.run();
  }, []);

  return <AppView></AppView>;
}
