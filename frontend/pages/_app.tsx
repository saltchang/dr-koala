import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import AppContainer from '@/components/AppContainer';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import UserAgreementDialog from '@/components/UserAgreementDialog';

import '@/styles/globals.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import Head from 'next/head';

const queryClientConfig = {
  queries: {
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  },
};

const TERMS_AGREEMENT_COOKIE = 'dr_koala_terms_agreed';

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

  const [showAgreementDialog, setShowAgreementDialog] = useState(false);

  useEffect(() => {
    const hasAgreed = Cookies.get(TERMS_AGREEMENT_COOKIE);
    if (!hasAgreed) {
      setShowAgreementDialog(true);
    }
  }, []);

  const handleAgreeTerms = () => {
    const agreementTime = new Date().toISOString();
    Cookies.set(TERMS_AGREEMENT_COOKIE, agreementTime, { expires: 36500 });
    setShowAgreementDialog(false);
  };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />

        <title>Dr. Koala</title>
        <meta
          name="description"
          content="Dr. Koala is a chatbot that can answer questions and help you with your problems."
        />
        <meta name="application-name" content="Dr. Koala" />
      </Head>
      <ThemeProvider themes={['dark'] as const} attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <UserAgreementDialog open={showAgreementDialog} onConfirm={handleAgreeTerms} />
          <AppContainer>
            <Component {...pageProps} />
          </AppContainer>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}
