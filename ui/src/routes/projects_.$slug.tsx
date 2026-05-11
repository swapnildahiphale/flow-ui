import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectDetailPage } from '@/components/pages/ProjectDetailPage';

export const Route = createFileRoute('/projects_/$slug')({
  component: () => {
    const { slug } = Route.useParams();
    const project  = useQuery({ queryKey: ['project', slug],          queryFn: () => api.project(slug) });
    const brief    = useQuery({ queryKey: ['project', slug, 'brief'], queryFn: () => api.projectBrief(slug) });
    const updates  = useQuery({ queryKey: ['project', slug, 'ups'],   queryFn: () => api.projectUpdates(slug) });
    const ptasks   = useQuery({ queryKey: ['project', slug, 'tasks'], queryFn: () => api.projectTasks(slug) });
    const tasks    = useQuery({ queryKey: ['tasks'],                  queryFn: () => api.tasks() });
    const projects = useQuery({ queryKey: ['projects'],               queryFn: api.projects });
    const tags     = useQuery({ queryKey: ['tags'],                   queryFn: api.tags });
    if (!project.data) return <div className="p-12 text-slate-400">Loading…</div>;
    const vocab = {
      tasks: new Set((tasks.data?.tasks ?? []).map(t => t.slug)),
      projects: new Set((projects.data?.projects ?? []).map(p => p.slug)),
      tags: new Set((tags.data?.tags ?? []).map(t => t.tag)),
    };
    return <ProjectDetailPage project={project.data} brief={brief.data?.markdown} updates={updates.data?.updates ?? []} tasks={ptasks.data?.tasks ?? []} vocab={vocab} />;
  },
});
