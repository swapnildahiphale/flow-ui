import { memo } from 'react';

export const ShimmerOverlay = memo(function ShimmerOverlay() {
  return <div className="shimmer absolute inset-x-0 -inset-y-1 rounded-md opacity-30 pointer-events-none" aria-hidden />;
});
