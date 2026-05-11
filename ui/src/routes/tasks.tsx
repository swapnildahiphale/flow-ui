import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TasksPage } from '@/components/pages/TasksPage';
import { z } from 'zod';

const TaskSearch = z.object({
  status:   z.enum(['in-progress','backlog','done']).optional(),
  priority: z.enum(['high','medium','low']).optional(),
  project:  z.string().optional(),
  tag:      z.string().optional(),
  archived: z.literal('1').optional(),
});

export const Route = createFileRoute('/tasks')({
  validateSearch: TaskSearch.parse,
  component: () => {
    const search = Route.useSearch();
    const tasks    = useQuery({ queryKey: ['tasks', search], queryFn: () => api.tasks(search) });
    const projects = useQuery({ queryKey: ['projects'],      queryFn: api.projects });
    const tags     = useQuery({ queryKey: ['tags'],          queryFn: api.tags });
    return (
      <TasksPage
        search={search}
        tasks={tasks.data?.tasks ?? []}
        projects={projects.data?.projects ?? []}
        tags={tags.data?.tags ?? []}
        loading={tasks.isLoading}
      />
    );
  },
});
