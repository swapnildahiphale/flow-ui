import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TaskDetailPage } from '@/components/pages/TaskDetailPage';

export const Route = createFileRoute('/tasks_/$slug')({
  component: () => {
    const { slug } = Route.useParams();
    const task    = useQuery({ queryKey: ['task', slug],         queryFn: () => api.task(slug) });
    const brief   = useQuery({ queryKey: ['task', slug, 'brief'], queryFn: () => api.taskBrief(slug) });
    const updates = useQuery({ queryKey: ['task', slug, 'ups'],   queryFn: () => api.taskUpdates(slug) });
    const tasks   = useQuery({ queryKey: ['tasks'],               queryFn: () => api.tasks() });
    const projects= useQuery({ queryKey: ['projects'],            queryFn: api.projects });
    const tags    = useQuery({ queryKey: ['tags'],                queryFn: api.tags });
    if (!task.data) return <div className="p-12 text-slate-400">Loading…</div>;
    const vocab = {
      tasks: new Set((tasks.data?.tasks ?? []).map(t => t.slug)),
      projects: new Set((projects.data?.projects ?? []).map(p => p.slug)),
      tags: new Set((tags.data?.tags ?? []).map(t => t.tag)),
    };
    return <TaskDetailPage task={task.data} brief={brief.data?.markdown} updates={updates.data?.updates ?? []} vocab={vocab} />;
  },
});
