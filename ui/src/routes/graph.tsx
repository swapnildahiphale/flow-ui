import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GraphPage } from '@/components/pages/GraphPage';

export const Route = createFileRoute('/graph')({
  component: () => {
    const g = useQuery({ queryKey: ['graph'], queryFn: api.graph });
    return <GraphPage graph={g.data} loading={g.isLoading} />;
  },
});
