import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PlaybookDetailPage } from '@/components/pages/PlaybookDetailPage';

export const Route = createFileRoute('/playbooks_/$slug')({
  component: () => {
    const { slug } = Route.useParams();
    const pb    = useQuery({ queryKey: ['playbook', slug],         queryFn: () => api.playbook(slug) });
    const brief = useQuery({ queryKey: ['playbook', slug, 'brief'], queryFn: () => api.playbookBrief(slug) });
    const runs  = useQuery({ queryKey: ['playbook', slug, 'runs'],  queryFn: () => api.playbookRuns(slug) });
    if (!pb.data) return <div className="p-12 text-slate-400">Loading…</div>;
    return <PlaybookDetailPage playbook={pb.data} brief={brief.data?.markdown} runs={runs.data?.runs ?? []} />;
  },
});
