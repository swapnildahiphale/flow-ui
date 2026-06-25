import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Archive, Check, CircleNotch } from '@phosphor-icons/react';
import type { Task } from '@/lib/types';
import { api } from '@/lib/api';
import { clsx } from '@/lib/clsx';

// Inline Do / Archive actions for a task list row. The row itself is a TanStack
// Router <Link> (an <a>), so every handler stops the click from navigating to the
// detail page. Mutations route through the flow CLI (read-only-DB rule); on success
// we only invalidate queries — no navigation (unlike the detail-page archive). An
// archived row then leaves the active list, and a Do'd row gains its live-session
// dot in place.
export function TaskRowActions({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const doTask = useMutation({
    mutationFn: () => api.doTask(task.slug),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const archive = useMutation({
    mutationFn: () => api.archiveTask(task.slug),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  // Archive is easy to misclick in a dense list, so it's two-step: first click
  // arms, second click archives. Auto-disarm after a beat and on mouse-leave.
  const [armed, setArmed] = useState(false);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = () => {
    setArmed(true);
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
    disarmTimer.current = setTimeout(() => setArmed(false), 3000);
  };
  const disarm = () => {
    setArmed(false);
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
  };
  // Drop a pending disarm timer if the row unmounts mid-armed (e.g. a list
  // refresh removes this row) so it can't fire setArmed on an unmounted component.
  useEffect(() => () => { if (disarmTimer.current) clearTimeout(disarmTimer.current); }, []);

  const stop = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const onDo = (e: MouseEvent) => {
    stop(e);
    if (doTask.isPending) return;
    doTask.mutate();
  };
  const onArchive = (e: MouseEvent) => {
    stop(e);
    if (archive.isPending) return;
    if (!armed) { arm(); return; }
    disarm();
    archive.mutate();
  };

  const btn = 'inline-flex items-center justify-center h-7 w-7 rounded-md border border-slate-200/70 bg-white transition active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center gap-1" onMouseLeave={disarm}>
      <button
        type="button"
        onClick={onDo}
        disabled={doTask.isPending}
        title={doTask.isError ? `Couldn’t start: ${(doTask.error as Error).message}` : task.session_id ? 'Resume session' : 'Run flow do'}
        className={clsx(btn, doTask.isError ? 'text-red-600 hover:bg-red-50 hover:border-red-200' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200')}
      >
        {doTask.isPending ? <CircleNotch size={14} className="animate-spin" /> : <Play size={14} />}
      </button>
      {!task.archived_at && (
        <button
          type="button"
          onClick={onArchive}
          disabled={archive.isPending}
          title={archive.isError ? `Couldn’t archive: ${(archive.error as Error).message}` : armed ? 'Click again to archive' : 'Archive'}
          className={clsx(btn, armed || archive.isError ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100' : 'text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200')}
        >
          {archive.isPending ? <CircleNotch size={14} className="animate-spin" /> : armed ? <Check size={14} /> : <Archive size={14} />}
        </button>
      )}
    </div>
  );
}
