import { memo } from 'react';
import { clsx } from '@/lib/clsx';

export const BreathingBlob = memo(function BreathingBlob({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx('absolute rounded-full breath pointer-events-none', className)}
      style={{ backgroundColor: 'rgb(16 185 129 / 0.12)', filter: 'blur(40px)' }}
    />
  );
});
