import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KBReaderPage } from '@/components/pages/KBReaderPage';

export const Route = createFileRoute('/kb_/$file')({
  component: () => {
    const { file } = Route.useParams();
    const list = useQuery({ queryKey: ['kb'], queryFn: api.kbList });
    const body = useQuery({ queryKey: ['kb', file], queryFn: () => api.kbRead(file) });
    const tasks = useQuery({ queryKey: ['tasks'], queryFn: () => api.tasks() });
    const projects = useQuery({ queryKey: ['projects'], queryFn: api.projects });
    const tags = useQuery({ queryKey: ['tags'], queryFn: api.tags });
    if (!body.data) return <div className="p-12 text-slate-400">Loading…</div>;
    const vocab = {
      tasks: new Set((tasks.data?.tasks ?? []).map(t => t.slug)),
      projects: new Set((projects.data?.projects ?? []).map(p => p.slug)),
      tags: new Set((tags.data?.tags ?? []).map(t => t.tag)),
    };
    return <KBReaderPage current={file} files={list.data?.files ?? []} body={body.data.markdown} mtime={body.data.mtime} vocab={vocab} />;
  },
});
