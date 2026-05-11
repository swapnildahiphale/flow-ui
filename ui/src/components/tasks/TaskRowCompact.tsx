import type { Task } from '@/lib/types';
import { StatusDot } from '@/components/motion/StatusDot';
import { Chip } from '@/components/primitives/Chip';
import { relative } from '@/lib/time';
import { ShimmerOverlay } from '@/components/motion/ShimmerOverlay';

export function TaskRowCompact({ task }: { task: Task }) {
  const isLive = task.status === 'in-progress' && !task.stale;
  // NOTE: Plan suggested <Link to="/tasks/$slug">, but the /tasks/$slug route is
  // not registered until Task 15. Fall back to <a href> per the Task 11 pattern;
  // upgrade to typed <Link> once the route file exists.
  return (
    <a
      href={`/tasks/${task.slug}`}
      className="task-row grid items-center gap-5 px-6 py-4 hover:bg-slate-50/60 transition-colors"
      style={{ gridTemplateColumns: '12px minmax(0,1fr) auto' }}
    >
      <StatusDot status={task.stale ? 'stale' : task.status} />
      <div className="min-w-0 relative">
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="font-mono text-[12px] text-slate-500">{task.slug}</span>
          {task.project_slug && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{task.project_slug}</span>
          )}
        </div>
        <div className="text-[14.5px] text-slate-900 truncate">{task.name}</div>
        {task.stale && <ShimmerOverlay />}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 min-w-[120px]">
        {task.waiting_on
          ? <Chip variant="amber">waiting · {task.waiting_on.split(/[,(]/)[0].trim()}</Chip>
          : task.stale
            ? <Chip variant="outline">stale</Chip>
            : <Chip variant="accent">{isLive ? 'in flight' : task.status}</Chip>}
        <span className="font-mono text-[11px] text-slate-400">{relative(task.updated_at)}</span>
      </div>
    </a>
  );
}
