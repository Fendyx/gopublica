'use client'; // если понадобится, но react-markdown работает и на сервере

import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
}

export default function LegalPage({ content }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg)] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none
          prose-headings:text-[var(--text)] prose-p:text-[var(--text-muted)] prose-strong:text-[var(--text)]
          prose-li:text-[var(--text-muted)] prose-a:text-[var(--primary-color)]">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}