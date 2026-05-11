import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { queryClient } from '../lib/queryClient';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'VIVA_QUERY_CACHE',
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }} // 24h persistence
    >
      {children}
    </PersistQueryClientProvider>
  );
};
