'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface Props {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mt-2 mb-6 pb-4 border-b border-[var(--border)]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-10 mb-4 pb-2 border-b border-[var(--border)]/50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg sm:text-xl font-semibold text-[var(--text)] mt-8 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[var(--text-muted)] leading-relaxed mb-4 text-[15px]">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="text-[var(--text)] font-semibold">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--primary-color)] underline underline-offset-2 decoration-[var(--primary-color)]/30 hover:decoration-[var(--primary-color)] transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-none space-y-2 mb-6 ml-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-none space-y-2 mb-6 ml-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-3 text-[var(--text-muted)] text-[15px] leading-relaxed">
      <span className="flex-none w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]/40 mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <div className="my-6 pl-4 border-l-4 border-[var(--primary-color)]/30 bg-[var(--primary-color)]/5 rounded-r-lg px-5 py-4">
      <div className="text-[var(--text-muted)] text-[15px] leading-relaxed italic">
        {children}
      </div>
    </div>
  ),
  hr: () => (
    <hr className="my-10 border-0 border-t border-[var(--border)]" />
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-[15px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--surface)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-[var(--text-muted)] border-b border-[var(--border)]/50">
      {children}
    </td>
  ),
  code: ({ className, children }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--primary-color)] text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className={className}>{children}</code>
    );
  },
};

export default function LegalPage({ content }: Props) {
  return (
    <div className="legal-content">
      <article className="max-w-none">
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}