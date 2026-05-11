import type { Playbook } from '@/lib/types';
import { Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/primitives/EmptyState';

export function PlaybooksPage({ playbooks, loading }: { playbooks: Playbook[]; loading: boolean }) {
  if (loading) return <div className="p-12 text-slate-400">Loading…</div>;
  if (playbooks.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-10 py-24">
        <EmptyState
          title="No playbooks yet"
          body='Playbooks are reusable, runnable definitions for repeated work — incident triage, weekly reviews, release cuts.'
          command='flow add playbook "weekly-review"'
        />
      </div>
    );
  }
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <header className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Playbooks</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-slate-900">{playbooks.length} defined</h1>
      </header>
      <ul className="grid grid-cols-12 gap-x-8 gap-y-12">
        {playbooks.map((p, i) => (
          <li key={p.slug} className={`col-span-12 md:col-span-6 ${i % 2 ? 'md:col-start-7' : ''}`}>
            <Link to="/playbooks/$slug" params={{ slug: p.slug }} className="block group">
              <h2 className="text-2xl font-medium tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">{p.name}</h2>
              <div className="mt-2 font-mono text-[12px] text-slate-500 truncate">{p.work_dir}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
