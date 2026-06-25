import type { Task, Update } from '@/lib/types';
import { Chip } from '@/components/primitives/Chip';
import { MarkdownView } from '@/components/markdown/MarkdownView';
import { Link, useNavigate, useRouter, useCanGoBack } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, CaretRight, Archive, Play } from '@phosphor-icons/react';
import { relative } from '@/lib/time';
import { api } from '@/lib/api';
import type { Vocab } from '@/lib/cross-ref';
import { PRIORITY_VARIANT } from '@/lib/priority';

export function TaskDetailPage({ task, brief, updates, vocab }: { task: Task; brief?: string; updates: Update[]; vocab: Vocab }) {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const queryClient = useQueryClient();
  const archive = useMutation({
    mutationFn: () => api.archiveTask(task.slug),
    onSuccess: () => {
      // Archiving touches lists, counts, project views and the graph — invalidate
      // everything rather than enumerate keys that drift over time.
      queryClient.invalidateQueries();
      // Return to the exact list the user came from (preserves filters + scroll);
      // fall back to the task list when there's no in-app history (direct link / CmdK).
      if (canGoBack) router.history.back();
      else navigate({ to: '/tasks' });
    },
  });
  // `flow do` spawns an interactive terminal tab + Claude session on the host and
  // returns immediately, so this is fire-and-forget: stay on the page and confirm
  // via a banner rather than navigating away (unlike archive). `flow do` writes the
  // task's session_id to the DB before it returns, so invalidate to pull the fresh
  // session state (live marker, sidebar Session block, Do→Resume label).
  const doTask = useMutation({
    mutationFn: () => api.doTask(task.slug),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const isWaiting = task.status === 'in-progress' && !!task.waiting_on;
  const statusLabel = isWaiting ? 'waiting' : task.status;
  const statusVariant: 'accent' | 'amber' | 'neutral' = isWaiting ? 'amber' : task.status === 'done' ? 'neutral' : 'accent';
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/tasks" className="hover:text-slate-800">Tasks</Link>
        <CaretRight size={14} className="text-slate-300" />
        <span className="font-mono text-slate-700">{task.slug}</span>
        <Chip variant={statusVariant} className="ml-3">{statusLabel}</Chip>
      </div>

      <header className="flex items-end justify-between gap-8 mb-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight text-slate-900">{task.name}</h1>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="font-mono text-slate-500">{task.slug}</span>
            {task.project_slug && <><span className="text-slate-300">·</span><span className="text-slate-600">{task.project_slug}</span></>}
            {task.session_id && task.session_started && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 inline-flex items-center gap-1.5">
                  <span className="live-dot w-1.5 h-1.5 rounded-full" />
                  session live · {relative(task.session_started)}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigator.clipboard.writeText(`flow do ${task.slug}`)}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13.5px] font-medium bg-white text-slate-900 border border-slate-200/70 hover:bg-slate-50 transition active:translate-y-[1px]"
          >
            <Copy size={14} /> <span className="font-mono">flow do {task.slug}</span>
          </button>
          <button
            onClick={() => doTask.mutate()}
            disabled={doTask.isPending}
            title="Run flow do for this task"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13.5px] font-medium bg-white text-slate-600 border border-slate-200/70 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={14} /> <span>{doTask.isPending ? 'Opening…' : task.session_id ? 'Resume' : 'Do'}</span>
          </button>
          {!task.archived_at && (
            <button
              onClick={() => archive.mutate()}
              disabled={archive.isPending}
              title="Archive this task"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13.5px] font-medium bg-white text-slate-600 border border-slate-200/70 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Archive size={14} /> <span>{archive.isPending ? 'Archiving…' : 'Archive'}</span>
            </button>
          )}
        </div>
      </header>
      {doTask.isSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Opened a terminal tab for {task.slug} — switch to it to continue.
        </div>
      )}
      {doTask.isError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 whitespace-pre-line">
          Couldn’t start this task: {(doTask.error as Error).message}
        </div>
      )}
      {archive.isError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Couldn’t archive this task: {(archive.error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {brief && <MarkdownView source={brief} vocab={vocab} />}
          <section>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-6">Updates · {updates.length}</h2>
            <div className="border-l-2 border-slate-200 pl-6 ml-2 relative space-y-6">
              {updates.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No updates yet.</p>
              ) : updates.map(u => (
                <div key={u.filename} className="relative">
                  <div className="absolute -left-[28px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-mono text-[12px] text-slate-500">{u.date}</span>
                    <span className="text-sm text-slate-700 capitalize">{u.title}</span>
                  </div>
                  <MarkdownView source={u.body} vocab={vocab} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-[80px] rounded-2xl bg-white border border-slate-200/70 p-6 space-y-5">
            <Row label="Status"><Chip variant={statusVariant}>{statusLabel}</Chip></Row>
            <Row label="Priority"><Chip variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Chip></Row>
            <Row label="Due">{task.due_date ? <span className="font-mono text-sm">{task.due_date}</span> : <span className="text-sm text-slate-400">—</span>}</Row>
            {task.assignee && <Row label="Assignee"><span className="text-sm">{task.assignee}</span></Row>}
            {task.waiting_on && (
              <Row label="Waiting on">
                <span className="text-sm text-amber-700 text-right truncate max-w-[200px]" title={task.waiting_on}>
                  {task.waiting_on.split(/[,(]/)[0]?.trim() ?? task.waiting_on}
                </span>
              </Row>
            )}
            {task.project_slug && <Row label="Project"><span className="text-sm">{task.project_slug}</span></Row>}
            {task.tags.length > 0 && (
              <div className="pt-5 border-t border-slate-100">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map(t => <Chip key={t} variant="accent">#{t}</Chip>)}
                </div>
              </div>
            )}
            <div className="pt-5 border-t border-slate-100">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Workdir</div>
              <div className="font-mono text-[12px] text-slate-700 break-all">{task.work_dir}</div>
            </div>
            {task.session_id && (
              <div className="pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-500 uppercase tracking-wider">Session</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700"><span className="live-dot w-1.5 h-1.5 rounded-full" />live</span>
                </div>
                <div className="font-mono text-[11px] text-slate-500 break-all mt-1">{task.session_id}</div>
              </div>
            )}
            <div className="pt-5 border-t border-slate-100 space-y-2">
              <Row label="Created"><span className="font-mono text-[12px] text-slate-600">{relative(task.created_at)}</span></Row>
              <Row label="Updated"><span className="font-mono text-[12px] text-slate-600">{relative(task.updated_at)}</span></Row>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>{children}</div>;
}
