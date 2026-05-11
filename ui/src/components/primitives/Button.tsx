import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from '@/lib/clsx';

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost';

const VARIANT: Record<Variant, string> = {
  primary:   'bg-emerald-500 text-white hover:bg-emerald-600',
  secondary: 'bg-white text-slate-900 border border-slate-200/70 hover:bg-slate-50',
  soft:      'bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/80',
  ghost:     'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
};

export function Button({ variant = 'secondary', className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children?: ReactNode }) {
  return (
    <button
      {...props}
      className={clsx('inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13.5px] font-medium transition active:translate-y-[1px]', VARIANT[variant], className)}
    >
      {children}
    </button>
  );
}
