import { useEffect, useState } from "react";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [serverTime, setServerTime] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState<string>("");
  const [agentResponse, setAgentResponse] = useState<string>("");
  const [isAgentLoading, setIsAgentLoading] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7086";
    const eventSource = new EventSource(`${apiUrl}/api/time/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      setServerTime(event.data);
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      setIsConnected(false);
      setError("Connection error. Retrying...");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleAgentQuery = async () => {
    if (!query.trim()) {
      setAgentError("Please enter a question");
      return;
    }

    setIsAgentLoading(true);
    setAgentResponse("");
    setAgentError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7086";
      const response = await fetch(`${apiUrl}/api/agent/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              setAgentError(data.error);
              setIsAgentLoading(false);
              return;
            }
            
            if (data.done) {
              setIsAgentLoading(false);
              return;
            }
            
            if (data.content) {
              setAgentResponse((prev) => prev + data.content);
            }
          }
        }
      }

      setIsAgentLoading(false);
    } catch (err) {
      console.error("Agent query error:", err);
      setAgentError("Failed to get response from agent");
      setIsAgentLoading(false);
    }
  };

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black`}
    >
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Dr. Koala - AI Search Assistant
          </h1>
          
          <div className="flex flex-col gap-4 w-full max-w-2xl">
            <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h2 className="text-lg font-medium text-black dark:text-zinc-50 mb-4">
                Ask Me Anything
              </h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && !isAgentLoading && handleAgentQuery()}
                  placeholder="Enter your question..."
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAgentLoading}
                />
                <button
                  onClick={handleAgentQuery}
                  disabled={isAgentLoading}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  {isAgentLoading ? "Thinking..." : "Search"}
                </button>
              </div>
              {agentError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {agentError}
                </p>
              )}
              {agentResponse && (
                <div className="mt-4 p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    Response:
                  </h3>
                  <div className="text-sm text-black dark:text-zinc-50 whitespace-pre-wrap">
                    {agentResponse}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-2xl">
            <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                  Server Time (UTC)
                </h2>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
              <div className={`font-mono text-2xl ${geistMono.className} text-black dark:text-zinc-50`}>
                {serverTime || "Connecting..."}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Server time demo using Server-Sent Events (SSE), updates every second.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7086"}/docs`}
            target="_blank"
            rel="noopener noreferrer"
          >
            API Docs
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs/pages/getting-started?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
