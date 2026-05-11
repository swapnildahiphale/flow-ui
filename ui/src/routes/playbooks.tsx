import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PlaybooksPage } from '@/components/pages/PlaybooksPage';

export const Route = createFileRoute('/playbooks')({
  component: () => {
    const list = useQuery({ queryKey: ['playbooks'], queryFn: api.playbooks });
    return <PlaybooksPage playbooks={list.data?.playbooks ?? []} loading={list.isLoading} />;
  },
});
