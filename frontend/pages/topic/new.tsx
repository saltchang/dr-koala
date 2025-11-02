import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAskAgent } from '@/hooks/useAskAgent';

export default function NewTopic() {
  const router = useRouter();
  const { q: initialQuery } = router.query;
  const [hasStarted, setHasStarted] = useState(false);

  const { topicSessionId, content, isLoading, error, startStream } = useAskAgent();

  useEffect(() => {
    if (!hasStarted && typeof initialQuery === 'string' && initialQuery.trim()) {
      startStream(initialQuery);
      setHasStarted(true);
    }
  }, [initialQuery, hasStarted, startStream]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // TODO: should be optimized to:
    // 1. POST /sessions with query, then receive new session ID immediately
    // 2. navigate to /topic/${topicSessionId}
    // 3. start receiving new content streaming by session ID
    if (topicSessionId && typeof initialQuery === 'string') {
      router.replace({
        pathname: `/topic/${topicSessionId}`,
        query: { q: initialQuery },
      });
    }
  }, [topicSessionId, initialQuery, router, isLoading]);

  return (
    <main className="flex flex-1 flex-col p-4 md:p-6">
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-4">
        {initialQuery && (
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-sm font-medium text-muted-foreground mb-2">Question:</div>
            <div className="text-sm whitespace-pre-wrap">{initialQuery}</div>
          </div>
        )}

        {!content && isLoading && (
          // TODO: add a loading animation
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-lg text-muted-foreground">Thinking...</p>
          </div>
        )}

        {content && (
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-sm font-medium text-muted-foreground mb-2">Answer:</div>
            <div className="text-sm whitespace-pre-wrap">{content}</div>
            {isLoading && <div className="mt-2 text-muted-foreground text-xs">Streaming...</div>}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
