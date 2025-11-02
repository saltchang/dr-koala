import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useState } from 'react';
import AppContainer from '@/components/AppContainer';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

import '@/styles/globals.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

const queryClientConfig = {
  queries: {
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  },
};

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryClientConfig,
        queryCache: new QueryCache({
          onError: () => {
            // handle error here
          },
        }),
        mutationCache: new MutationCache({
          onError: () => {
            // handle error here
          },
        }),
      }),
  );

  return (
    <ThemeProvider themes={['dark'] as const} attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AppContainer>
          <Component {...pageProps} />
        </AppContainer>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
