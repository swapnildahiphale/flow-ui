import { Link, useNavigate } from '@tanstack/react-router';
import type { Project, TagCount } from '@/lib/types';
import { Chip } from '@/components/primitives/Chip';
import { clsx } from '@/lib/clsx';

type Search = { status?: string; priority?: string; project?: string; tag?: string };

export function FilterRail({ projects, tags, search }: { projects: Project[]; tags: TagCount[]; search: Search }) {
  const nav = useNavigate({ from: '/tasks' });
  const toggle = (k: keyof Search, v: string) => () => nav({ search: ({ ...search, [k]: search[k] === v ? undefined : v }) as any });

  return (
    <div className="sticky top-[80px] space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-3">Status</div>
        <ul className="space-y-1.5 text-sm">
          {(['in-progress','waiting','backlog','done'] as const).map(s => (
            <li key={s}>
              <button onClick={toggle('status', s)} className={clsx('flex items-center gap-2.5 w-full text-left', search.status === s ? 'text-emerald-700 font-medium' : 'text-slate-700 hover:text-slate-900')}>
                <span className={clsx('w-3.5 h-3.5 rounded border', search.status === s ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300')} />
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-3">Priority</div>
        <div className="flex flex-wrap gap-1.5">
          {(['high','medium','low'] as const).map(p => (
            <button key={p} onClick={toggle('priority', p)}>
              <Chip variant={search.priority === p ? 'accent' : 'neutral'}>{p}</Chip>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-3">Project</div>
        <ul className="space-y-1 text-sm">
          {projects.map(p => (
            <li key={p.slug}>
              <button onClick={toggle('project', p.slug)} className={clsx('w-full text-left', search.project === p.slug ? 'text-emerald-700 font-medium' : 'text-slate-700 hover:text-slate-900')}>
                {p.slug}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-3">Tags</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 12).map(t => (
            <button key={t.tag} onClick={toggle('tag', t.tag)}>
              <Chip variant={search.tag === t.tag ? 'accent' : 'neutral'}>#{t.tag}</Chip>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Link to="/tasks" search={{}} className="text-[12px] text-slate-500 hover:text-slate-800">clear all</Link>
      </div>
    </div>
  );
}
