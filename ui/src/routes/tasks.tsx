import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TasksPage } from '@/components/pages/TasksPage';
import { z } from 'zod';

const TaskSearch = z.object({
  status:   z.enum(['in-progress','backlog','done','waiting']).optional(),
  priority: z.enum(['high','medium','low']).optional(),
  project:  z.string().optional(),
  tag:      z.string().optional(),
  archived: z.literal('1').optional(),
});

export const Route = createFileRoute('/tasks')({
  validateSearch: TaskSearch.parse,
  component: () => {
    const search = Route.useSearch();
    // 'waiting' is a synthetic status: in-progress tasks with waiting_on set.
    // Fetch in-progress from the API, then narrow client-side.
    // Playbook runs are never shown here — they live under /playbooks/<slug>.
    const apiParams = {
      ...(search.status === 'waiting' ? { ...search, status: 'in-progress' as const } : search),
      kind: 'regular',
    };
    const tasks    = useQuery({ queryKey: ['tasks', apiParams], queryFn: () => api.tasks(apiParams) });
    const projects = useQuery({ queryKey: ['projects'],         queryFn: api.projects });
    const tags     = useQuery({ queryKey: ['tags'],             queryFn: api.tags });
    const rows = (tasks.data?.tasks ?? []).filter(t => search.status !== 'waiting' || !!t.waiting_on);
    return (
      <TasksPage
        search={search}
        tasks={rows}
        projects={projects.data?.projects ?? []}
        tags={tags.data?.tags ?? []}
        loading={tasks.isLoading}
      />
    );
  },
});
