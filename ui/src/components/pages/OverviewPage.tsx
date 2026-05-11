import type { Stats, Task, TagCount, TimelineEntry } from '@/lib/types';
import { Chip } from '@/components/primitives/Chip';
import { StatTile } from '@/components/bento/StatTile';
import { ActivityCarousel } from '@/components/bento/ActivityCarousel';
import { TaskRowCompact } from '@/components/tasks/TaskRowCompact';
import { Skeleton } from '@/components/primitives/Skeleton';
import { Lightning, ArrowRight } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { relative } from '@/lib/time';

const todayLabel = new Date()
  .toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  .toUpperCase()
  .replaceAll(',', ' ·');

export function OverviewPage({ stats, inflight, tags, timeline, loading }: {
  stats?: Stats;
  inflight: Task[];
  tags: TagCount[];
  timeline: TimelineEntry[];
  loading: boolean;
}) {
  const safeInflight = inflight ?? [];
  const safeTags = tags ?? [];
  const safeTimeline = timeline ?? [];
  const liveSessions = safeInflight.filter(t => t.session_id).length;
  const lastLive = safeInflight
    .filter(t => t.session_id && t.session_started)
    .slice()
    .sort((a, b) => (b.session_last_resumed ?? b.session_started!).localeCompare(a.session_last_resumed ?? a.session_started!))[0];
  const inflightTotal = stats?.tasks_by_status?.['in-progress'] ?? 0;
  const total = Object.values(stats?.tasks_by_status ?? {}).reduce((a, b) => a + b, 0);
  const breakdown = ['high', 'medium', 'low'].map(p => ({
    label: p,
    value: stats?.tasks_by_priority?.[p] ?? 0,
  }));

  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12 space-y-12">
      <header className="flex items-end justify-between gap-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-4">Overview</div>
          <h1 className="text-5xl md:text-6xl font-medium tracking-tighter leading-[0.95] text-slate-900">
            Today<span className="text-emerald-700">.</span>
          </h1>
          <p className="mt-4 text-slate-500 font-mono text-sm tabular-nums tracking-wide">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="live-dot w-2 h-2 rounded-full" />
            <span className="font-mono">{liveSessions} live session{liveSessions === 1 ? '' : 's'}</span>
          </span>
          {lastLive ? (
            <Link
              to="/tasks/$slug"
              params={{ slug: lastLive.slug }}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13.5px] font-medium bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/80 transition active:translate-y-[1px]"
              title={`Resume ${lastLive.slug}`}
            >
              <Lightning size={14} /> Resume last
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13.5px] font-medium bg-slate-100/60 text-slate-400 cursor-not-allowed"
              title="No live sessions to resume"
            >
              <Lightning size={14} /> Resume last
            </span>
          )}
        </div>
      </header>

      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-5">
          {loading
            ? <Skeleton className="h-80 rounded-[2.5rem]" />
            : <StatTile label="In flight" value={inflightTotal} total={total} breakdown={breakdown} spark={[2, 4, 3, 6, 5, 7, 8]} />}
        </div>
        <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-x-10 px-2">
          <a href="/tasks?status=waiting" className="border-t border-slate-200 pt-6 block hover:text-emerald-700 transition-colors">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Waiting</div>
            <div className="mt-4 text-4xl font-medium tracking-tight font-mono tabular-nums text-slate-900">{stats?.waiting_count ?? 0}</div>
          </a>
          <a href="/tasks?priority=high" className="border-t border-slate-200 pt-6 block hover:text-emerald-700 transition-colors">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">High priority</div>
            <div className="mt-4 text-4xl font-medium tracking-tight font-mono tabular-nums text-slate-900">{stats?.tasks_by_priority?.high ?? 0}</div>
          </a>
          <div className="border-t border-slate-200 pt-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Overdue</div>
            <div className="mt-4 text-4xl font-medium tracking-tight font-mono tabular-nums text-slate-900">{stats?.overdue_count ?? 0}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-8">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-medium tracking-tight text-slate-900">In flight</h2>
            <a href="/tasks" className="text-sm text-emerald-700 font-medium hover:underline inline-flex items-center gap-1">All tasks <ArrowRight size={14} /></a>
          </div>
          <div className="rounded-[2.5rem] bg-white border border-slate-200/70 p-2 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)]">
            <ul className="divide-y divide-slate-100">
              {safeInflight.map(t => <li key={t.slug}><TaskRowCompact task={t} /></li>)}
              {safeInflight.length === 0 && !loading && (
                <li className="px-6 py-8 text-center text-slate-400 text-sm">No active tasks right now.</li>
              )}
            </ul>
          </div>
        </div>
        <aside className="col-span-12 md:col-span-4 space-y-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-4">Tag cloud</div>
            <div className="flex flex-wrap gap-1.5">
              {safeTags.slice(0, 14).map(t => (
                <a key={t.tag} href={`/tasks?tag=${encodeURIComponent(t.tag)}`}>
                  <Chip variant={t.count > 1 ? 'accent' : 'neutral'}>#{t.tag}{t.count > 1 && ` ·${t.count}`}</Chip>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-4">Project activity · 14d</div>
          <ActivityCarousel items={[
            { project: 'callqa', updates: 12, accent: true },
            { project: 'callai', updates: 5 },
            { project: 'flow-itself', updates: 18, accent: true },
          ]} />
        </div>
        <div className="col-span-12 md:col-span-7">
          <div className="flex items-end justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Recent updates</div>
            <a href="/timeline" className="text-sm text-emerald-700 font-medium hover:underline">Timeline →</a>
          </div>
          <ul className="divide-y divide-slate-100">
            {safeTimeline.map(e => (
              <li key={e.filename} className="py-4 flex gap-5">
                <div className="font-mono text-[11px] text-slate-400 shrink-0 w-14 pt-0.5">{relative(e.date)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-[12px] text-slate-500">{e.slug}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">{e.body}</p>
                </div>
              </li>
            ))}
            {safeTimeline.length === 0 && <li className="py-4 text-slate-400 text-sm">No recent updates.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
