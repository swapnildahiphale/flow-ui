import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { OverviewPage } from '@/components/pages/OverviewPage';

export const Route = createFileRoute('/')({
  component: () => {
    const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
    const inflight = useQuery({
      queryKey: ['tasks', 'inflight'],
      queryFn: () => api.tasks({ status: 'in-progress', kind: 'regular' }),
    });
    const tags = useQuery({ queryKey: ['tags'], queryFn: api.tags });
    const timeline = useQuery({
      queryKey: ['timeline', '7d'],
      queryFn: () => api.timeline(),
    });
    return (
      <OverviewPage
        stats={stats.data}
        inflight={inflight.data?.tasks ?? []}
        tags={tags.data?.tags ?? []}
        timeline={(timeline.data?.entries ?? []).slice(0, 5)}
        loading={stats.isLoading || inflight.isLoading}
      />
    );
  },
});
