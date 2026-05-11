import { useMemo, useState } from 'react';
import { GraphCanvas, lightTheme } from 'reagraph';
import type { Graph as G } from '@/lib/types';
import { EmptyState } from '@/components/primitives/EmptyState';
import { GraphIcon } from '@phosphor-icons/react';

const NODE_FILL: Record<string, string> = {
  task:    '#10b981',
  project: '#334155',
  person:  '#f59e0b',
  tag:     '#10b981',
};
const NODE_SIZE: Record<string, number> = { task: 7, project: 12, person: 7, tag: 5 };

const EDGE_FILL_DEFAULT = 'rgb(148 163 184 / 0.6)';
const EDGE_FILL_WAITING = '#f59e0b';
const EDGE_FILL_TAG     = 'rgb(16 185 129 / 0.55)';

const THEME = {
  ...lightTheme,
  canvas: { background: 'transparent' },
  node: {
    ...lightTheme.node,
    label: { ...lightTheme.node.label, color: 'rgb(71 85 105)', stroke: 'rgba(255,255,255,0.85)' },
  },
};

export function GraphPage({ graph, loading }: { graph?: G; loading: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    const nodes = graph.nodes.map(n => ({
      id: n.id,
      label: n.label,
      fill: NODE_FILL[n.type] ?? '#94a3b8',
      size: NODE_SIZE[n.type] ?? 7,
      data: n,
    }));
    const edges = graph.edges.map((e, i) => ({
      id: `${e.source}->${e.target}-${i}`,
      source: e.source,
      target: e.target,
      fill: e.kind === 'waiting' ? EDGE_FILL_WAITING : e.kind === 'tag' ? EDGE_FILL_TAG : EDGE_FILL_DEFAULT,
      dashed: e.kind === 'waiting',
      size: e.kind === 'waiting' ? 1.5 : 1,
    }));
    return { nodes, edges };
  }, [graph]);

  if (loading) return <div className="p-12 text-slate-400">Loading graph…</div>;
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-10 py-24">
        <EmptyState title="No graph yet" body="Create a task or project, attach a tag, or set a waiting_on note — the graph fills in as your work grows." icon={<GraphIcon size={48} weight="regular" className="text-slate-300" />} />
      </div>
    );
  }
  return (
    <div className="relative h-[calc(100dvh-57px)]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)', backgroundSize: '28px 28px' }}>
      <div className="absolute inset-0">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          theme={THEME}
          layoutType="forceDirected2d"
          labelType="auto"
          onNodeClick={(n) => setSelected(n.id)}
          onCanvasClick={() => setSelected(null)}
        />
      </div>
      <div className="absolute top-6 left-6 font-mono text-xs text-slate-500 pointer-events-none">
        <div className="text-slate-700 font-medium tracking-tight text-base">Graph</div>
        <div className="mt-1">{graph.nodes.length} nodes · {graph.edges.length} edges · force</div>
      </div>
      <div className="absolute bottom-6 left-6 rounded-2xl bg-white border border-slate-200/70 px-4 py-3 flex items-center gap-5 text-xs">
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />task</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" />project</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />person</span>
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />tag</span>
      </div>
      {selected && <SelectedNodeCard id={selected} graph={graph} />}
    </div>
  );
}

function SelectedNodeCard({ id, graph }: { id: string; graph: G }) {
  const n = graph.nodes.find(x => x.id === id);
  if (!n) return null;
  return (
    <div className="absolute right-6 top-6 w-72 rounded-2xl p-5 border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_60px_-20px_rgba(15,23,42,0.18)]"
         style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(140%)' }}>
      <div className="font-mono text-[12px] text-emerald-700 font-medium">{n.label}</div>
      <div className="text-[12px] text-slate-500 mt-1 capitalize">{n.type}</div>
      {n.meta && <pre className="mt-3 text-[11px] text-slate-600 leading-relaxed overflow-x-auto">{JSON.stringify(n.meta, null, 2)}</pre>}
    </div>
  );
}
