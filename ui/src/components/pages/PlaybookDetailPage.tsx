import type { Playbook, Task } from '@/lib/types';
import { MarkdownView } from '@/components/markdown/MarkdownView';
import { TaskRowCompact } from '@/components/tasks/TaskRowCompact';
import { Link } from '@tanstack/react-router';

export function PlaybookDetailPage({ playbook, brief, runs }: { playbook: Playbook; brief?: string; runs: Task[] }) {
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <div className="mb-8 text-sm text-slate-500"><Link to="/playbooks" className="hover:text-slate-800">Playbooks</Link></div>
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-3">{playbook.name}</h1>
      <div className="mb-10 font-mono text-sm text-slate-500">{playbook.slug}</div>
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {brief && <MarkdownView source={brief} />}
          <section>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-6">Runs · {runs.length}</h2>
            {runs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No runs yet.</p>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200/70 p-2">
                <ul className="divide-y divide-slate-100">
                  {runs.map(r => <li key={r.slug}><TaskRowCompact task={r} /></li>)}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
