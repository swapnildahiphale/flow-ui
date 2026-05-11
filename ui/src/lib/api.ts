import type { Task, Project, Playbook, Update, KBFile, Stats, TimelineEntry, Graph, TagCount } from './types';

const BASE = '/api/v1';

async function get<T>(url: string): Promise<T> {
  const r = await fetch(BASE + url);
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || `HTTP ${r.status}`);
  }
  return r.json();
}

export const api = {
  health: () => get<{ status: string }>('/health'),
  stats: () => get<Stats>('/stats'),

  tasks: (params: Partial<{ status: string; priority: string; project: string; tag: string; kind: string; archived: string }> = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    return get<{ tasks: Task[]; count: number }>(`/tasks${q.toString() ? '?' + q : ''}`);
  },
  task: (slug: string) => get<Task>(`/tasks/${encodeURIComponent(slug)}`),
  taskBrief: (slug: string) => get<{ markdown: string }>(`/tasks/${encodeURIComponent(slug)}/brief`),
  taskUpdates: (slug: string) => get<{ updates: Update[]; count: number }>(`/tasks/${encodeURIComponent(slug)}/updates`),

  projects: () => get<{ projects: Project[]; count: number }>('/projects'),
  project: (slug: string) => get<Project>(`/projects/${encodeURIComponent(slug)}`),
  projectBrief: (slug: string) => get<{ markdown: string }>(`/projects/${encodeURIComponent(slug)}/brief`),
  projectUpdates: (slug: string) => get<{ updates: Update[]; count: number }>(`/projects/${encodeURIComponent(slug)}/updates`),
  projectTasks: (slug: string) => get<{ tasks: Task[]; count: number }>(`/projects/${encodeURIComponent(slug)}/tasks`),

  playbooks: () => get<{ playbooks: Playbook[]; count: number }>('/playbooks'),
  playbook: (slug: string) => get<Playbook>(`/playbooks/${encodeURIComponent(slug)}`),
  playbookBrief: (slug: string) => get<{ markdown: string }>(`/playbooks/${encodeURIComponent(slug)}/brief`),
  playbookRuns: (slug: string) => get<{ runs: Task[]; count: number }>(`/playbooks/${encodeURIComponent(slug)}/runs`),

  kbList: () => get<{ files: KBFile[]; count: number }>('/kb'),
  kbRead: (name: string) => get<{ markdown: string; mtime: string; name: string }>(`/kb/${encodeURIComponent(name)}`),

  timeline: (since?: string) => get<{ entries: TimelineEntry[]; count: number }>(`/timeline${since ? '?since=' + since : ''}`),
  graph: () => get<Graph>('/graph'),
  tags: () => get<{ tags: TagCount[]; count: number }>('/tags'),
};
