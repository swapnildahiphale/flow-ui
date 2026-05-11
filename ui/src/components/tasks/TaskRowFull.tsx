import { Link } from '@tanstack/react-router';
import type { Task } from '@/lib/types';
import { Chip } from '@/components/primitives/Chip';
import { StatusDot } from '@/components/motion/StatusDot';
import { ShimmerOverlay } from '@/components/motion/ShimmerOverlay';
import { relative } from '@/lib/time';
import { PRIORITY_VARIANT } from '@/lib/priority';

export function TaskRowFull({ task }: { task: Task }) {
  return (
    <Link
      to="/tasks/$slug" params={{ slug: task.slug }}
      className="task-row grid items-center gap-5 py-5 hover:bg-slate-50/60 transition-colors px-2 rounded-lg"
      style={{ gridTemplateColumns: '12px minmax(0,1fr) auto auto auto' }}
    >
      <StatusDot status={task.stale ? 'stale' : task.status} />
      <div className="min-w-0 relative">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[12px] text-slate-500">{task.slug}</span>
          {task.project_slug && <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{task.project_slug}</span>}
          <Chip variant={PRIORITY_VARIANT[task.priority]} className="!ml-2">{task.priority}</Chip>
        </div>
        <div className="mt-1 text-[14.5px] text-slate-900 truncate">{task.name}</div>
        {task.stale && <ShimmerOverlay />}
      </div>
      <div className="hidden xl:flex items-center gap-1.5">
        {task.tags.slice(0, 3).map(t => <Chip key={t} variant="neutral">#{t}</Chip>)}
      </div>
      <div className="text-right shrink-0 w-28">
        {task.waiting_on
          ? <Chip variant="amber">waiting</Chip>
          : task.stale
            ? <Chip variant="outline">stale</Chip>
            : <Chip variant="accent">{task.status}</Chip>}
        <div className="font-mono text-[11px] text-slate-500 mt-0.5">{task.waiting_on?.split(/[,(]/)[0]?.trim() ?? relative(task.updated_at)}</div>
      </div>
      <div className="font-mono text-[11px] text-slate-400 shrink-0 w-16 text-right">{relative(task.updated_at)}</div>
    </Link>
  );
}
