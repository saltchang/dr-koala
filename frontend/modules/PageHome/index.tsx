import { useRouter } from 'next/router';
import { memo, useState } from 'react';
import svgDrKoalaLogo from '@/assets/dr-koala.svg';
import ChatInput from '@/components/ChatInput';
import SVG from '@/components/SVG';

function PageHome() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [isComposing, setIsComposing] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!query.trim()) {
      return;
    }

    router.push({
      pathname: '/topic/new',
      query: { q: query },
    });
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
      <div className="flex flex-col items-center gap-6 mb-12 max-w-2xl">
        <SVG src={svgDrKoalaLogo.src} className="w-40 h-40" />
        <h1 className="text-4xl font-bold text-center">Dr. Koala</h1>
      </div>

      <div className="w-full max-w-[640px]">
        <div className="p-6 rounded-lg border bg-card shadow-lg sticky bottom-4">
          <div className="flex flex-col gap-3">
            <ChatInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => e.key === 'Enter' && !isComposing && handleSubmit()}
              onSend={handleSubmit}
              placeholder="Ask Dr. Koala anything..."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(PageHome);
