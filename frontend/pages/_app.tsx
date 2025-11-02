import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useState } from 'react';
import AppContainer from '@/components/AppContainer';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import type { TopicSession } from '@/types/topicSession';

import '@/styles/globals.css';

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

  const [topicSessions, setTopicSessions] = useState<TopicSession[]>([]);

  return (
    <ThemeProvider themes={['dark'] as const} attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AppContainer topicSessions={topicSessions}>
          <Component {...pageProps} topicSessions={topicSessions} setTopicSessions={setTopicSessions} />
        </AppContainer>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
