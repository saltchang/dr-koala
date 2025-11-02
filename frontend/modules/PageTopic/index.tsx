import { StatusCodes } from 'http-status-codes';
import { useRouter } from 'next/router';
import { memo, useCallback, useEffect, useState } from 'react';
import ChatInput from '@/components/ChatInput';
import { useAskAgent } from '@/hooks/useAskAgent';
import { useTopicSession } from '@/hooks/useTopicSession';
import { ApiResponseError } from '@/types/api';

interface PageTopicProps {
  topicSessionId: string;
}

function PageTopic({ topicSessionId }: PageTopicProps) {
  const router = useRouter();
  const { q: initialQuery } = router.query;

  const [query, setQuery] = useState<string>('');
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [hasStartedInitialQuery, setHasStartedInitialQuery] = useState(false);

  const { content, isLoading: isResponseStreaming, error, startStream, reset } = useAskAgent();

  const {
    data: topicSession,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useTopicSession(topicSessionId, !isResponseStreaming);

  useEffect(() => {
    if (isResponseStreaming) {
      return;
    }

    if (
      !hasStartedInitialQuery &&
      !isLoadingHistory &&
      topicSession &&
      topicSession.turns.length === 0 &&
      typeof initialQuery === 'string' &&
      initialQuery.trim()
    ) {
      setCurrentQuestion(initialQuery);
      startStream(initialQuery, topicSessionId);
      setHasStartedInitialQuery(true);

      router.replace(`/topic/${topicSessionId}`, undefined, { shallow: true });
    }
  }, [
    initialQuery,
    topicSessionId,
    topicSession,
    isLoadingHistory,
    hasStartedInitialQuery,
    startStream,
    router,
    isResponseStreaming,
  ]);

  useEffect(() => {
    if (!isResponseStreaming && currentQuestion && content) {
      const timer = setTimeout(() => {
        setCurrentQuestion('');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isResponseStreaming, currentQuestion, content]);

  const handleFollowUpQuery = useCallback(() => {
    if (!query.trim() || isResponseStreaming) {
      return;
    }

    const currentQuery = query;

    setCurrentQuestion(currentQuery);
    setQuery('');
    reset();

    startStream(currentQuery, topicSessionId);
  }, [query, topicSessionId, isResponseStreaming, startStream, reset]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isComposing && !isResponseStreaming) {
        handleFollowUpQuery();
      }
    },
    [isComposing, isResponseStreaming, handleFollowUpQuery],
  );

  useEffect(() => {
    if (isResponseStreaming || isLoadingHistory) {
      return;
    }

    if (historyError instanceof ApiResponseError && historyError.httpStatusCode === StatusCodes.NOT_FOUND) {
      router.replace('/');
    }
  }, [historyError, router, isResponseStreaming, isLoadingHistory]);

  if (isLoadingHistory || !topicSession) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-lg text-muted-foreground">Loading topicSession...</p>
        </div>
      </main>
    );
  }

  if (historyError instanceof Error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="text-destructive">{historyError.message}</div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 md:p-6">
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-4">
        {topicSession?.turns.length > 0 && (
          <div className="flex flex-col gap-4">
            {topicSession.turns.map((turn, index) => (
              <div key={`${turn.timestamp}-${index}`} className="p-6 rounded-lg border bg-card">
                <div className="text-sm font-medium text-muted-foreground mb-2">Question:</div>
                <div className="text-sm whitespace-pre-wrap">{turn.query}</div>
                <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">Answer:</div>
                <div className="text-sm whitespace-pre-wrap">{turn.response}</div>
              </div>
            ))}
          </div>
        )}

        {currentQuestion && (
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-sm font-medium text-muted-foreground mb-2">Question:</div>
            <div className="text-sm whitespace-pre-wrap">{currentQuestion}</div>

            {isResponseStreaming && (
              <>
                <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">Answer:</div>
                <div className="text-sm whitespace-pre-wrap">
                  {content || (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-100">●</span>
                      <span className="animate-pulse delay-200">●</span>
                    </span>
                  )}
                </div>
              </>
            )}

            {!isResponseStreaming && content && (
              <>
                <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">Answer:</div>
                <div className="text-sm whitespace-pre-wrap">{content}</div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        <div className="sticky bottom-4 p-6 rounded-lg border bg-card shadow-lg">
          <div className="flex flex-col gap-3">
            <ChatInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={handleKeyDown}
              onSend={handleFollowUpQuery}
              placeholder="Ask Dr. Koala more questions..."
              disabled={isResponseStreaming}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(PageTopic);
