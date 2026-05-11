import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TimelinePage } from '@/components/pages/TimelinePage';

export const Route = createFileRoute('/timeline')({
  component: () => {
    const t = useQuery({ queryKey: ['timeline'], queryFn: () => api.timeline() });
    return <TimelinePage entries={t.data?.entries ?? []} loading={t.isLoading} />;
  },
});
