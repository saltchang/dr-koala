import { useRouter } from 'next/router';
import { memo, useEffect, useRef, useState } from 'react';
import svgDrKoalaLogo from '@/assets/dr-koala.svg';
import ChatInput from '@/components/ChatInput';
import SVG from '@/components/SVG';
import { useCreateSession } from '@/hooks/useCreateSession';

function PageHome() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const { mutateAsync: createSession, isPending: isCreatingSession } = useCreateSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!query.trim() || isCreatingSession) {
      return;
    }

    try {
      const title = query.trim();
      if (!title) {
        return;
      }

      const { id: sessionId } = await createSession({ title });

      router.push({
        pathname: `/topic/${sessionId}`,
        query: { q: query },
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 h-[80%] bg-background">
      <div className="flex flex-col items-center gap-6 mb-12 max-w-2xl">
        <SVG src={svgDrKoalaLogo.src} className="w-40 h-40" />
        <h1 className="text-4xl font-bold text-center">Dr. Koala</h1>
      </div>

      <div className="w-full max-w-[640px]">
        <ChatInput
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => e.key === 'Enter' && !isComposing && handleSubmit()}
          onSend={handleSubmit}
          placeholder="Ask Dr. Koala anything..."
          disabled={isCreatingSession}
        />
      </div>
    </main>
  );
}

export default memo(PageHome);
