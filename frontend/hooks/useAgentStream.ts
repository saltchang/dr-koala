import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAgentStreamResult {
  sessionId: string | null;
  content: string;
  isLoading: boolean;
  error: string | null;
  startStream: (query: string, existingSessionId?: string | null) => Promise<void>;
  reset: () => void;
}

// TODO: should rename to a more descriptive name
export function useAgentStream(): UseAgentStreamResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setSessionId(null);
    setContent('');
    setError(null);
    setIsLoading(false);
  }, []);

  const startStream = useCallback(async (query: string, existingSessionId?: string | null) => {
    // TODO: can be optimized with react-query

    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setContent('');
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          session_id: existingSessionId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

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
              setError(data.error);
              setIsLoading(false);
              return;
            }

            if (data.done) {
              setIsLoading(false);
              return;
            }

            if (data.content) {
              setContent((prev) => prev + data.content);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Agent stream error:', err);
      setError('Failed to get response from agent');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    sessionId,
    content,
    isLoading,
    error,
    startStream,
    reset,
  };
}
