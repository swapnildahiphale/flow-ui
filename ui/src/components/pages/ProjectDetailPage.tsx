import type { Project, Task, Update } from '@/lib/types';
import { MarkdownView } from '@/components/markdown/MarkdownView';
import { Chip } from '@/components/primitives/Chip';
import { Link } from '@tanstack/react-router';
import { CaretRight } from '@phosphor-icons/react';
import type { Vocab } from '@/lib/cross-ref';
import { TaskRowCompact } from '@/components/tasks/TaskRowCompact';
import { PRIORITY_VARIANT } from '@/lib/priority';

export function ProjectDetailPage({ project, brief, updates, tasks, vocab }: { project: Project; brief?: string; updates: Update[]; tasks: Task[]; vocab: Vocab }) {
  const groups = { 'in-progress': [] as Task[], backlog: [] as Task[], done: [] as Task[] };
  for (const t of tasks) groups[t.status].push(t);

  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/projects" className="hover:text-slate-800">Projects</Link>
        <CaretRight size={14} className="text-slate-300" />
        <span className="font-mono text-slate-700">{project.slug}</span>
      </div>

      <header className="flex items-end justify-between gap-8 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight text-slate-900">{project.name}</h1>
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
            <span className="font-mono">{project.slug}</span>
            <Chip variant={PRIORITY_VARIANT[project.priority]}>{project.priority}</Chip>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {brief && <MarkdownView source={brief} vocab={vocab} />}

          <section>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-6">Tasks · {tasks.length}</h2>
            {(['in-progress', 'backlog', 'done'] as const).map(status =>
              groups[status].length > 0 && (
                <div key={status} className="mb-6">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2 px-6">{status}</div>
                  <div className="rounded-2xl bg-white border border-slate-200/70 p-2">
                    <ul className="divide-y divide-slate-100">
                      {groups[status].map(t => <li key={t.slug}><TaskRowCompact task={t} /></li>)}
                    </ul>
                  </div>
                </div>
              )
            )}
          </section>

          {updates.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-6">Updates · {updates.length}</h2>
              <div className="border-l-2 border-slate-200 pl-6 ml-2 space-y-6">
                {updates.map(u => (
                  <div key={u.filename}>
                    <div className="font-mono text-[12px] text-slate-500 mb-1">{u.date}</div>
                    <MarkdownView source={u.body} vocab={vocab} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-[80px] rounded-2xl bg-white border border-slate-200/70 p-6 space-y-4">
            <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">Status</span><Chip variant="accent">{project.status}</Chip></div>
            <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">Priority</span><Chip variant={PRIORITY_VARIANT[project.priority]}>{project.priority}</Chip></div>
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Workdir</div>
              <div className="font-mono text-[12px] text-slate-700 break-all">{project.work_dir}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
