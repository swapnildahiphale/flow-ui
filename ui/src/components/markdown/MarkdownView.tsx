import { useMemo } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import type { Vocab } from '@/lib/cross-ref';

export function MarkdownView({ source, vocab, className }: { source: string; vocab?: Vocab; className?: string }) {
  const html = useMemo(() => renderMarkdown(source, vocab), [source, vocab]);
  return (
    <div
      className={(className ?? '') + ' prose-flow text-[15px] text-slate-700 leading-[1.7] max-w-[65ch] [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-slate-900 [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-5 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5 [&_ul]:space-y-1 [&_code]:font-mono [&_code]:text-[13px] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:text-slate-800 [&_a.xref]:text-emerald-700 [&_a.xref]:font-mono [&_a.xref]:text-[13px] [&_a.xref]:hover:underline'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
