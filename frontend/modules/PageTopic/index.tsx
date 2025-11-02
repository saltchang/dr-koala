import { StatusCodes } from 'http-status-codes';
import { useRouter } from 'next/router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import AgentSteps from '@/components/AgentSteps';
import ChatInput from '@/components/ChatInput';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { useTopicSessionWithStreaming } from '@/hooks/useTopicSessionWithStreaming';
import { ApiResponseError } from '@/types/api';

interface PageTopicProps {
  topicSessionId: string;
}

function PageTopic({ topicSessionId }: PageTopicProps) {
  const router = useRouter();
  const { q: initialQuery } = router.query;

  const [query, setQuery] = useState<string>('');
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [hasStartedInitialQuery, setHasStartedInitialQuery] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    turns,
    isLoading: isLoadingHistory,
    isStreaming,
    error,
    submitQuestion,
    reset,
    streamingCurrentStep,
  } = useTopicSessionWithStreaming(topicSessionId);

  useEffect(() => {
    if (hasStartedInitialQuery || typeof initialQuery !== 'string' || !initialQuery.trim() || isStreaming) {
      return;
    }

    submitQuestion(initialQuery, topicSessionId);

    router.replace(`/topic/${topicSessionId}`, undefined, { shallow: true });
    setHasStartedInitialQuery(true);
  }, [initialQuery, topicSessionId, hasStartedInitialQuery, submitQuestion, router, isStreaming]);

  useEffect(() => {
    if (!isStreaming && !isLoadingHistory && hasStartedInitialQuery) {
      inputRef.current?.focus();
    }
  }, [isStreaming, isLoadingHistory, hasStartedInitialQuery]);

  const handleFollowUpQuery = useCallback(() => {
    if (!query.trim() || isStreaming) {
      return;
    }

    const currentQuery = query;

    setQuery('');
    reset();

    submitQuestion(currentQuery, topicSessionId);
  }, [query, topicSessionId, isStreaming, submitQuestion, reset]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isComposing && !isStreaming) {
        handleFollowUpQuery();
      }
    },
    [isComposing, isStreaming, handleFollowUpQuery],
  );

  useEffect(() => {
    if (isStreaming || isLoadingHistory) {
      return;
    }

    if (error instanceof ApiResponseError && error.httpStatusCode === StatusCodes.NOT_FOUND) {
      router.replace('/');
    }
  }, [error, router, isStreaming, isLoadingHistory]);

  if (isLoadingHistory && turns.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-lg text-muted-foreground">Loading session...</p>
        </div>
      </main>
    );
  }

  if (error instanceof Error && !isStreaming) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="text-destructive">{error.message}</div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 md:p-6">
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-8">
        {turns.length > 0 && (
          <div className="flex flex-col gap-6">
            {turns.map((turn, index) => {
              const isLastTurn = index === turns.length - 1;
              const isStreamingTurn = isLastTurn && isStreaming;

              return (
                <div key={turn.query ? `${turn.query}-${index}` : `streaming-${index}`} className="flex flex-col gap-3">
                  <h2 className="text-3xl font-semibold text-foreground leading-loose">{turn.query}</h2>

                  <Card className="shadow-md">
                    <CardContent className="p-6">
                      {turn.steps && turn.steps.length > 0 && (
                        <AgentSteps
                          steps={turn.steps}
                          currentStep={isStreamingTurn ? streamingCurrentStep : null}
                          isProcessing={isStreamingTurn}
                        />
                      )}

                      {isStreamingTurn && !turn.response ? (
                        <div className="text-sm">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <span className="animate-pulse">●</span>
                            <span className="animate-pulse delay-100">●</span>
                            <span className="animate-pulse delay-200">●</span>
                          </span>
                        </div>
                      ) : turn.response ? (
                        <MarkdownRenderer content={turn.response} />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {error && isStreaming && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error.message}</p>
            </CardContent>
          </Card>
        )}

        <Card className="sticky bottom-4 shadow-lg">
          <ChatInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            onSend={handleFollowUpQuery}
            placeholder="Ask Dr. Koala more questions..."
            disabled={isStreaming}
          />
        </Card>
      </div>
    </main>
  );
}

export default memo(PageTopic);
