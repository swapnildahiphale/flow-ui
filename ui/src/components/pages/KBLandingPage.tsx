import type { KBFile } from '@/lib/types';
import { Link } from '@tanstack/react-router';
import { relative } from '@/lib/time';

const DESC: Record<string, string> = {
  user: 'Durable facts about you — role, preferences, working style.',
  org: 'Company, team, structure, people you interact with.',
  products: 'What your org ships — product lines, modules, releases.',
  processes: 'How your org works — tools, conventions, rituals.',
  business: 'Customers, business model, revenue, deals, positioning.',
};

export function KBLandingPage({ files, loading }: { files: KBFile[]; loading: boolean }) {
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <header className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Knowledge base</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-slate-900">~/.flow/kb<span className="text-emerald-700">/</span></h1>
      </header>
      {loading ? <div className="text-slate-400">Loading…</div> : (
        <ul className="grid grid-cols-12 gap-x-8 gap-y-12">
          {files.map((f, i) => (
            <li key={f.name} className={`col-span-12 md:col-span-6 ${i % 2 ? 'md:col-start-7' : ''}`}>
              <Link to="/kb/$file" params={{ file: f.name }} className="block group">
                <div className="flex items-baseline gap-3 mb-2">
                  <h2 className="text-2xl font-medium tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">{f.name}<span className="text-slate-400">.md</span></h2>
                  <span className="font-mono text-xs text-slate-400">{f.entries} entries</span>
                </div>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-[55ch]">{DESC[f.name]}</p>
                <div className="mt-3 font-mono text-[11px] text-slate-400">updated {relative(f.mtime)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
