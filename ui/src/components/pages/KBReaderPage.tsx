import type { KBFile } from '@/lib/types';
import { Link } from '@tanstack/react-router';
import { MarkdownView } from '@/components/markdown/MarkdownView';
import type { Vocab } from '@/lib/cross-ref';
import { clsx } from '@/lib/clsx';
import { relative } from '@/lib/time';

const ORDER = ['user', 'org', 'products', 'processes', 'business'];

export function KBReaderPage({ current, files, body, mtime, vocab }: { current: string; files: KBFile[]; body: string; mtime: string; vocab: Vocab }) {
  const ordered = ORDER.map(n => files.find(f => f.name === n)).filter(Boolean) as KBFile[];
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <header className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Knowledge base</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-slate-900">{current}<span className="text-emerald-700">.md</span></h1>
        <p className="mt-2 text-slate-500 font-mono text-sm">last updated {relative(mtime)}</p>
      </header>
      <div className="flex items-center gap-1 p-1 mb-10 rounded-full bg-slate-100/80 border border-slate-200/50 w-fit">
        {ordered.map(f => (
          <Link key={f.name} to="/kb/$file" params={{ file: f.name }}
            className={clsx('px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors',
              f.name === current ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
            {f.name}<span className="font-mono text-[11px] text-slate-400 ml-1">{f.entries}</span>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-10">
        <article className="col-span-12 lg:col-span-8"><MarkdownView source={body} vocab={vocab} /></article>
      </div>
    </div>
  );
}
