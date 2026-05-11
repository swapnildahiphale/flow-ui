import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/layout/Shell';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
