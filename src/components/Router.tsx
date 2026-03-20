import { useState, useEffect } from 'react';
import { OutreachSystem } from './OutreachSystem';
import { FailedWebsitesPage } from './nessie/FailedWebsitesPage';
import LeadsTable from './nessie/LeadsTable';
import { DocsPage } from '../pages/DocsPage';
import { SeedPage } from '../pages/SeedPage';
import { NessieQueue } from '../pages/NessieQueue';
import { CreateBatchPage } from '../pages/CreateBatchPage';

export const Router = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  switch (currentPath) {
    case '/':
    case '/queue':
      return <NessieQueue />;
    case '/leads':
      return <LeadsTable />;
    case '/nessie':
      return <FailedWebsitesPage />;
    case '/queue/new':
      return <CreateBatchPage />;
    case '/docs':
      return <DocsPage />;
    case '/dev/seed':
      return <SeedPage />;
    case '/old':
      return <OutreachSystem />;
    default:
      return <NessieQueue />;
  }
};