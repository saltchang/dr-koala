import { memo, useCallback, useEffect, useState } from 'react';
import svgDrKoalaLogo from '@/assets/dr-koala.svg';
import ChatInput from '@/components/ChatInput';
import SVG from '@/components/SVG';

interface ConversationTurn {
  query: string;
  response: string;
  timestamp: string;
}

interface PageHomeProps {
  setConversations?: (
    conversations: Array<{
      id: string;
      query: string;
      timestamp: string;
    }>,
  ) => void;
}

function PageHome({ setConversations }: PageHomeProps) {
  const [query, setQuery] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationTurns, setConversationTurns] = useState<
    ConversationTurn[]
  >([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isAgentLoading, setIsAgentLoading] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);

  const handleAgentQuery = useCallback(async () => {
    if (!query.trim()) {
      setAgentError('Please enter a question');
      return;
    }

    setIsAgentLoading(true);
    setCurrentResponse('');
    setAgentError(null);

    const currentQuery = query;
    const queryTimestamp = new Date().toISOString();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.session_id) {
              setSessionId(data.session_id);
            }

            if (data.error) {
              setAgentError(data.error);
              setIsAgentLoading(false);
              return;
            }

            if (data.done) {
              setConversationTurns((prev) => [
                ...prev,
                {
                  query: currentQuery,
                  response: accumulatedResponse,
                  timestamp: queryTimestamp,
                },
              ]);
              setCurrentResponse('');
              setQuery('');
              setIsAgentLoading(false);
              return;
            }

            if (data.content) {
              accumulatedResponse += data.content;
              setCurrentResponse((prev) => prev + data.content);
            }
          }
        }
      }

      setIsAgentLoading(false);
    } catch (err) {
      console.error('Agent query error:', err);
      setAgentError('Failed to get response from agent');
      setIsAgentLoading(false);
    }
  }, [query, sessionId]);

  const handleNewConversation = useCallback(() => {
    setSessionId(null);
    setConversationTurns([]);
    setCurrentResponse('');
    setQuery('');
    setAgentError(null);
  }, []);

  useEffect(() => {
    const handleNewConversationEvent = () => {
      handleNewConversation();
    };

    window.addEventListener('newConversation', handleNewConversationEvent);
    return () => {
      window.removeEventListener('newConversation', handleNewConversationEvent);
    };
  }, [handleNewConversation]);

  useEffect(() => {
    if (setConversations && conversationTurns.length > 0) {
      const globalConversations = conversationTurns.map((turn) => ({
        id: turn.timestamp,
        query: turn.query,
        timestamp: turn.timestamp,
      }));
      setConversations(globalConversations);
    }
  }, [conversationTurns, setConversations]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
      {conversationTurns.length === 0 && !currentResponse && (
        <div className="flex flex-col items-center gap-6 mb-12 max-w-2xl">
          <SVG src={svgDrKoalaLogo.src} className="w-40 h-40" />
          <h1 className="text-4xl font-bold text-center">Dr. Koala</h1>
        </div>
      )}

      <div className="w-full max-w-[640px] flex flex-col gap-4">
        {conversationTurns.length > 0 && (
          <div className="flex flex-col gap-4">
            {conversationTurns.map((turn) => (
              <div
                key={turn.timestamp}
                className="p-6 rounded-lg border bg-card"
              >
                <div className="mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Question:
                  </div>
                  <div className="text-base font-medium">{turn.query}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Answer:
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {turn.response}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className={`p-6 rounded-lg border bg-card shadow-lg ${conversationTurns.length === 0 ? 'sticky bottom-4' : ''}`}
        >
          <div className="flex flex-col gap-3">
            <ChatInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                !isAgentLoading &&
                !isComposing &&
                handleAgentQuery()
              }
              onSend={handleAgentQuery}
              placeholder="Ask Dr. Koala anything..."
              disabled={isAgentLoading}
            />
          </div>
          {agentError && (
            <p className="mt-3 text-sm text-destructive">{agentError}</p>
          )}
          {currentResponse && (
            <div className="mt-4 p-4 rounded-lg border bg-muted">
              <div className="text-sm whitespace-pre-wrap">
                {currentResponse}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default memo(PageHome);
