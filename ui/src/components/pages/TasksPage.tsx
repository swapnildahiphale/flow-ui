import type { Task, Project, TagCount } from '@/lib/types';
import { FilterRail } from '@/components/tasks/FilterRail';
import { TaskRowFull } from '@/components/tasks/TaskRowFull';
import { Skeleton } from '@/components/primitives/Skeleton';

export function TasksPage({ tasks, projects, tags, search, loading }: {
  tasks: Task[]; projects: Project[]; tags: TagCount[]; search: Record<string, string | undefined>; loading: boolean;
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-10 py-12">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Tasks</div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-slate-900">All tasks</h1>
          <p className="mt-3 text-slate-500 font-mono text-sm">{tasks.length} matching</p>
        </div>
      </header>
      <div className="grid grid-cols-12 gap-10">
        <aside className="col-span-12 lg:col-span-3">
          <FilterRail projects={projects} tags={tags} search={search} />
        </aside>
        <div className="col-span-12 lg:col-span-9">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.map(t => <li key={t.slug}><TaskRowFull task={t} /></li>)}
              {tasks.length === 0 && <li className="py-16 text-center text-slate-400">No tasks match.</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
