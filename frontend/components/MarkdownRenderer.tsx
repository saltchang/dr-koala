import Image from 'next/image';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-foreground border-b pb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-semibold mt-5 mb-3 text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h4>,
  h5: ({ children }) => <h5 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h6>,

  p: ({ children }) => <p className="mb-4 leading-7 text-foreground">{children}</p>,

  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal [&>li]:mt-2">{children}</ol>,
  li: ({ children }) => <li className="leading-7 text-foreground">{children}</li>,

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors"
    >
      {children}
    </a>
  ),

  pre: ({ children }) => (
    <pre className="mb-4 mt-2 overflow-x-auto rounded-lg bg-muted p-4 border border-border">{children}</pre>
  ),
  code: ({ className, children }) => {
    const isInline = !className;

    if (isInline) {
      return (
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground">
          {children}
        </code>
      );
    }

    return <code className="font-mono text-sm text-foreground">{children}</code>;
  },

  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground">{children}</blockquote>
  ),

  hr: () => <hr className="my-6 border-border" />,

  img: ({ src, alt }) => {
    if (!src) return null;
    if (typeof src !== 'string') return null;

    return <Image src={src} alt={alt || ''} className="mb-4 rounded-lg max-w-full h-auto" />;
  },

  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse border border-border">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 text-left font-semibold text-foreground">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2 text-foreground">{children}</td>,

  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground">{children}</em>,

  del: ({ children }) => <del className="line-through text-muted-foreground">{children}</del>,
};

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
