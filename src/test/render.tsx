import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = createTestQueryClient();
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient), ...options }) };
}

export { renderHook };
