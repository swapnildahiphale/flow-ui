import type { TimelineEntry } from '@/lib/types';
import { groupByDay } from '@/lib/time';

export function TimelinePage({ entries, loading }: { entries: TimelineEntry[]; loading: boolean }) {
  const grouped = groupByDay(entries, e => e.date);
  return (
    <div className="max-w-[1240px] mx-auto px-10 py-12">
      <header className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3">Timeline</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter leading-none text-slate-900">All updates</h1>
        <p className="mt-3 text-slate-500 font-mono text-sm">{entries.length} entries</p>
      </header>
      {loading ? <div className="text-slate-400">Loading…</div> : Object.entries(grouped).map(([day, items]) => (
        <section key={day} className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-4">{day}</div>
          <ul className="divide-y divide-slate-100">
            {items.map(e => (
              <li key={e.kind + e.slug + e.filename} className="py-4 flex gap-5">
                <div className="font-mono text-[11px] text-slate-500 shrink-0 w-24 pt-0.5">{e.slug}</div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700 leading-relaxed line-clamp-3">{e.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
