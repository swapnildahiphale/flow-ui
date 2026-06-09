import { describe, it, expect } from 'vitest';
import { buildForceData, computeFocusSet, NODE_COLOR } from './graph-data';
import type { Graph } from './types';

const g: Graph = {
  nodes: [
    { id: 'project:p', type: 'project', label: 'P' },
    { id: 'task:a', type: 'task', label: 'A' },
    { id: 'task:b', type: 'task', label: 'B', meta: { stale: true } },
    { id: 'person:mara', type: 'person', label: 'Mara' },
    { id: 'tag:bug', type: 'tag', label: 'bug' },
  ],
  edges: [
    { source: 'task:a', target: 'project:p', kind: 'membership' },
    { source: 'task:b', target: 'project:p', kind: 'membership' },
    { source: 'task:a', target: 'person:mara', kind: 'assignee' },
    { source: 'task:a', target: 'tag:bug', kind: 'tag' },
    { source: 'task:b', target: 'tag:bug', kind: 'tag' },
  ],
};

describe('buildForceData', () => {
  it('computes degree per node', () => {
    const { nodes } = buildForceData(g);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get('task:a')!.degree).toBe(3);
    expect(byId.get('project:p')!.degree).toBe(2);
    expect(byId.get('person:mara')!.degree).toBe(1);
  });
  it('node radius grows with degree and projects are largest', () => {
    const { nodes } = buildForceData(g);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get('task:a')!.radius).toBeGreaterThan(byId.get('person:mara')!.radius);
    expect(byId.get('project:p')!.radius).toBeGreaterThan(byId.get('task:a')!.radius);
  });
  it('flags stale tasks and assigns type colors', () => {
    const { nodes } = buildForceData(g);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get('task:b')!.stale).toBe(true);
    expect(byId.get('task:a')!.stroke).toBe(NODE_COLOR.task);
    expect(byId.get('task:b')!.stroke).toBe(NODE_COLOR.stale);
  });
  it('preserves links with kind', () => {
    const { links } = buildForceData(g);
    expect(links).toHaveLength(5);
    expect(links.find((l) => l.kind === 'waiting')).toBeUndefined();
    expect(links.every((l) => 'source' in l && 'target' in l && 'kind' in l)).toBe(true);
  });
});

describe('computeFocusSet', () => {
  it('returns null when no project focused', () => {
    expect(computeFocusSet(g, null)).toBeNull();
  });
  it('includes the project, its tasks, and their 1-hop neighbors', () => {
    const set = computeFocusSet(g, 'project:p')!;
    expect(set.has('project:p')).toBe(true);
    expect(set.has('task:a')).toBe(true);
    expect(set.has('task:b')).toBe(true);
    expect(set.has('person:mara')).toBe(true); // 1-hop from task:a
    expect(set.has('tag:bug')).toBe(true);
  });
});
