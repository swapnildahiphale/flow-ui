import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectsPage } from '@/components/pages/ProjectsPage';

export const Route = createFileRoute('/projects')({
  component: () => {
    const projects = useQuery({ queryKey: ['projects'], queryFn: api.projects });
    const tasks    = useQuery({ queryKey: ['tasks'],    queryFn: () => api.tasks() });
    return <ProjectsPage projects={projects.data?.projects ?? []} tasks={tasks.data?.tasks ?? []} loading={projects.isLoading} />;
  },
});
