import { memo, useCallback, useEffect, useState } from 'react';
import ChatInput from '@/components/ChatInput';
import { useAgentStream } from '@/hooks/useAgentStream';
import { type ConversationTurn, MessageRole } from '@/types/conversation';

interface PageTopicProps {
  sessionId: string;
}

function PageTopic({ sessionId }: PageTopicProps) {
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const [query, setQuery] = useState<string>('');
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { content, isLoading, error, startStream, reset } = useAgentStream();

  const loadConversationHistory = useCallback(async () => {
    // TODO: can be optimized with react-query

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/agent/conversation/${sessionId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setHistoryError(data.error);
        return;
      }

      if (data.turns && Array.isArray(data.turns)) {
        setConversationTurns(data.turns);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
      setHistoryError('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadConversationHistory();
    }
  }, [sessionId, loadConversationHistory]);

  const handleFollowUpQuery = useCallback(async () => {
    if (!query.trim() || isLoading) {
      return;
    }

    const currentQuery = query;
    const queryTimestamp = new Date().toISOString();

    setConversationTurns((prev) => [
      ...prev,
      {
        role: MessageRole.USER,
        content: currentQuery,
        timestamp: queryTimestamp,
      },
    ]);

    setQuery('');
    reset();

    await startStream(currentQuery, sessionId);

    setTimeout(() => {
      loadConversationHistory();
    }, 500);
  }, [query, sessionId, isLoading, startStream, reset, loadConversationHistory]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isComposing && !isLoading) {
        handleFollowUpQuery();
      }
    },
    [isComposing, isLoading, handleFollowUpQuery],
  );

  if (isLoadingHistory) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-lg text-muted-foreground">Loading conversation...</p>
        </div>
      </main>
    );
  }

  if (historyError) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
        <div className="text-destructive">{historyError}</div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 md:p-6">
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-4">
        {conversationTurns.length > 0 && (
          <div className="flex flex-col gap-4">
            {conversationTurns.map((turn, index) => (
              <div key={`${turn.timestamp}-${index}`} className="p-6 rounded-lg border bg-card">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {turn.role === MessageRole.USER ? 'Question:' : 'Answer:'}
                </div>
                <div className="text-sm whitespace-pre-wrap">{turn.content}</div>
              </div>
            ))}
          </div>
        )}

        {isLoading && content && (
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-sm font-medium text-muted-foreground mb-2">Answer:</div>
            <div className="text-sm whitespace-pre-wrap">{content}</div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
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
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(PageTopic);
