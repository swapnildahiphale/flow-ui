import { memo } from 'react';
import { clsx } from '@/lib/clsx';

export const StatusDot = memo(function StatusDot({ status }: { status: 'in-progress' | 'backlog' | 'done' | 'stale' }) {
  if (status === 'in-progress') return <span className="live-dot w-2 h-2 rounded-full shrink-0" aria-label="live" />;
  return (
    <span
      className={clsx(
        'w-2 h-2 rounded-full shrink-0',
        status === 'backlog' && 'bg-slate-400',
        status === 'done' && 'bg-slate-300',
        status === 'stale' && 'bg-slate-300'
      )}
    />
  );
});
