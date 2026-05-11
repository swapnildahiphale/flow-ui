import type { Project, Task } from '@/lib/types';
import { Link } from '@tanstack/react-router';
import { Chip } from '@/components/primitives/Chip';
import { relative } from '@/lib/time';

export function ProjectsPage({ projects, tasks, loading }: { projects: Project[]; tasks: Task[]; loading: boolean }) {
  if (loading) return <div className="p-12 text-slate-400">Loading…</div>;
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <header className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Projects</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-slate-900">{projects.length} active</h1>
      </header>
      {/* zigzag 2-column layout */}
      <ul className="grid grid-cols-12 gap-x-8 gap-y-12">
        {projects.map((p, i) => {
          const offset = i % 2 === 0 ? '' : 'md:col-start-7';
          const projectTasks = tasks.filter(t => t.project_slug === p.slug);
          const counts = { ip: 0, bl: 0, dn: 0 };
          for (const t of projectTasks) {
            if (t.status === 'in-progress') counts.ip++;
            else if (t.status === 'backlog') counts.bl++;
            else counts.dn++;
          }
          const newest = projectTasks.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
          return (
            <li key={p.slug} className={`col-span-12 md:col-span-6 ${offset}`}>
              <Link to="/projects/$slug" params={{ slug: p.slug }} className="block group">
                <div className="flex items-baseline gap-3 mb-2">
                  <h2 className="text-2xl font-medium tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">{p.name}</h2>
                  <Chip variant={p.priority === 'high' ? 'rose' : p.priority === 'medium' ? 'neutral' : 'outline'}>{p.priority}</Chip>
                </div>
                <div className="font-mono text-[12px] text-slate-500 mb-3 truncate">{p.work_dir}</div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span><span className="text-emerald-700 font-mono">{counts.ip}</span> IP</span>
                  <span><span className="font-mono">{counts.bl}</span> BL</span>
                  <span><span className="font-mono">{counts.dn}</span> done</span>
                  {newest && <span className="ml-auto font-mono text-[11px] text-slate-400">updated {relative(newest.updated_at)}</span>}
                </div>
              </Link>
            </li>
          );
        })}
        {projects.length === 0 && <li className="col-span-12 py-16 text-center text-slate-400">No projects yet.</li>}
      </ul>
    </div>
  );
}
