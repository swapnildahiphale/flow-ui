export function ActivityCarousel({ items }: { items: { project: string; updates: number; accent?: boolean }[] }) {
  const looped = [...items, ...items];
  return (
    <div className="rounded-[2.5rem] border border-slate-200/70 p-6 overflow-hidden relative bg-white shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)]">
      <div className="absolute right-6 top-6 font-mono text-[11px] text-slate-400">live ·</div>
      <div className="relative h-24">
        <div className="absolute inset-0 flex items-center gap-6 whitespace-nowrap carousel-track">
          {looped.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${it.accent ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="text-sm text-slate-700">{it.project}</span>
              <span className="font-mono text-xs text-slate-400">{it.updates} updates</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
