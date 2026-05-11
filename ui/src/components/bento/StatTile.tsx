import { BreathingBlob } from '@/components/motion/BreathingBlob';
import { Chip } from '@/components/primitives/Chip';
import { SparklineBars } from './SparklineBars';

export function StatTile({ label, value, total, breakdown, spark }: {
  label: string;
  value: number;
  total?: number;
  breakdown?: { label: string; value: number }[];
  spark?: number[];
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/70 p-10 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)]"
      style={{ background: 'linear-gradient(170deg, rgb(209 250 229 / 0.55), white 75%)' }}
    >
      <BreathingBlob className="-top-10 -right-10 w-44 h-44" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</span>
          <Chip variant="accent">Active</Chip>
        </div>
        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-7xl font-medium tracking-tighter text-emerald-800 font-mono tabular-nums">{value}</span>
          {total !== undefined && <span className="text-slate-400 font-mono text-sm">/ {total} total</span>}
        </div>
        {spark && <div className="mt-6"><SparklineBars values={spark} /></div>}
        {breakdown && (
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            {breakdown.map(b => (
              <div key={b.label}>
                <div className="font-mono tabular-nums text-slate-900 text-lg font-medium">{b.value}</div>
                <div className="text-slate-500 mt-0.5 text-xs uppercase tracking-wider">{b.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
