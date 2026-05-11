import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KBLandingPage } from '@/components/pages/KBLandingPage';

export const Route = createFileRoute('/kb')({
  component: () => {
    const list = useQuery({ queryKey: ['kb'], queryFn: api.kbList });
    return <KBLandingPage files={list.data?.files ?? []} loading={list.isLoading} />;
  },
});
