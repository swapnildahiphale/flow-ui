import { clsx } from '@/lib/clsx';
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('rounded-md bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]', className)} />;
}
