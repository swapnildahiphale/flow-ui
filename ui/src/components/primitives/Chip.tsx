import type { ReactNode } from 'react';
import { clsx } from '@/lib/clsx';

type Variant = 'accent' | 'neutral' | 'outline' | 'amber' | 'rose';

const VARIANT: Record<Variant, string> = {
  accent:  'bg-emerald-100/60 text-emerald-700',
  neutral: 'bg-slate-100 text-slate-600',
  outline: 'border border-slate-200 text-slate-600',
  amber:   'bg-amber-100/70 text-amber-700',
  rose:    'bg-rose-100/70 text-rose-700',
};

export function Chip({ variant = 'neutral', children, className }: { variant?: Variant; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-[2px] rounded-full font-mono text-[11px] font-medium leading-5', VARIANT[variant], className)}>
      {children}
    </span>
  );
}
