import type { Graph, GraphNode } from './types';

export type NodeType = 'task' | 'project' | 'person' | 'tag';

export const NODE_COLOR = {
  task: '#10b981',
  stale: '#d97706',
  project: '#94a3b8',
  person: '#d97706',
  tag: '#10b981',
} as const;

export const EDGE_STYLE: Record<
  Graph['edges'][number]['kind'],
  { color: string; alpha: number; width: number; dash: number[] | null }
> = {
  membership: { color: '#94a3b8', alpha: 0.5, width: 1.2, dash: null },
  tag: { color: '#10b981', alpha: 0.55, width: 1.2, dash: null },
  waiting: { color: '#d97706', alpha: 0.85, width: 1.5, dash: [6, 4] },
  assignee: { color: '#94a3b8', alpha: 0.5, width: 1.2, dash: null },
};

const BASE_R = 4;
const DEGREE_STEP = 1.8;
const PROJECT_BONUS = 4;

export interface FNode {
  id: string;
  type: NodeType;
  label: string;
  degree: number;
  radius: number;
  stale: boolean;
  stroke: string;
  // mutated by force-graph at runtime:
  x?: number; y?: number; fx?: number; fy?: number;
}
export interface FLink {
  source: string | FNode;
  target: string | FNode;
  kind: Graph['edges'][number]['kind'];
}

export function buildForceData(graph: Graph): { nodes: FNode[]; links: FLink[] } {
  const degree: Record<string, number> = {};
  graph.edges.forEach((e) => {
    degree[e.source] = (degree[e.source] ?? 0) + 1;
    degree[e.target] = (degree[e.target] ?? 0) + 1;
  });
  const nodes: FNode[] = graph.nodes.map((n: GraphNode) => {
    const d = degree[n.id] ?? 0;
    const stale = !!(n.meta && (n.meta as { stale?: boolean }).stale);
    const radius =
      BASE_R + Math.sqrt(d) * DEGREE_STEP + (n.type === 'project' ? PROJECT_BONUS : 0);
    const stroke =
      n.type === 'task' ? (stale ? NODE_COLOR.stale : NODE_COLOR.task) : NODE_COLOR[n.type];
    return { id: n.id, type: n.type, label: n.label, degree: d, radius, stale, stroke };
  });
  const links: FLink[] = graph.edges.map((e) => ({ source: e.source, target: e.target, kind: e.kind }));
  return { nodes, links };
}

export function computeFocusSet(graph: Graph, focusedProjectId: string | null): Set<string> | null {
  if (!focusedProjectId) return null;
  const set = new Set<string>([focusedProjectId]);
  graph.edges.forEach((e) => {
    if (e.kind === 'membership' && (e.source === focusedProjectId || e.target === focusedProjectId)) {
      set.add(e.source === focusedProjectId ? e.target : e.source);
    }
  });
  graph.edges.forEach((e) => {
    if (set.has(e.source)) set.add(e.target);
    if (set.has(e.target)) set.add(e.source);
  });
  return set;
}

/** 1-hop neighborhood of a node id (the node + direct neighbors + incident link indices). */
export function neighborhood(links: FLink[], nodeId: string): { nodes: Set<string>; links: Set<FLink> } {
  const ns = new Set<string>([nodeId]);
  const ls = new Set<FLink>();
  links.forEach((l) => {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (s === nodeId || t === nodeId) {
      ns.add(s); ns.add(t); ls.add(l);
    }
  });
  return { nodes: ns, links: ls };
}
