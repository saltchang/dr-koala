import type { AppProps } from 'next/app';
import { useState } from 'react';
import AppContainer from '@/components/AppContainer';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import type { Conversation } from '@/types/conversation';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  return (
    <ThemeProvider
      themes={['dark'] as const}
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <AppContainer conversations={conversations}>
        <Component
          {...pageProps}
          conversations={conversations}
          setConversations={setConversations}
        />
      </AppContainer>
    </ThemeProvider>
  );
}
