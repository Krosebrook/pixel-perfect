import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export const withProviders = (Story: () => ReactNode) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Story />
    </BrowserRouter>
  </QueryClientProvider>
);

export const withAuth = (Story: () => ReactNode) => (
  <AuthProvider>
    <Story />
  </AuthProvider>
);
