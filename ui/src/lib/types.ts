export type Task = {
  slug: string;
  name: string;
  project_slug?: string;
  status: 'backlog' | 'in-progress' | 'done';
  kind: 'regular' | 'playbook_run';
  playbook_slug?: string;
  priority: 'high' | 'medium' | 'low';
  work_dir: string;
  waiting_on?: string;
  due_date?: string;
  assignee?: string;
  status_changed_at?: string;
  session_id?: string;
  session_started?: string;
  session_last_resumed?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  tags: string[];
  stale: boolean;
};

export type Project = {
  slug: string;
  name: string;
  status: 'active' | 'done';
  priority: 'high' | 'medium' | 'low';
  work_dir: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
};

export type Playbook = {
  slug: string;
  name: string;
  project_slug?: string;
  work_dir: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
};

export type Update = { filename: string; date: string; title: string; body: string };
export type KBFile = { name: string; path: string; mtime: string; size: number; entries: number };
export type Stats = {
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  waiting_count: number;
  overdue_count: number;
  projects_active: number;
  playbooks_active: number;
};
export type TimelineEntry = { kind: 'tasks' | 'projects'; slug: string; filename: string; date: string; title: string; body: string };
export type GraphNode = { id: string; type: 'task' | 'project' | 'person' | 'tag'; label: string; meta?: Record<string, unknown> };
export type GraphEdge = { source: string; target: string; kind: 'membership' | 'waiting' | 'assignee' | 'tag' };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };
export type TagCount = { tag: string; count: number };
