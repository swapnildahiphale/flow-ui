import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Graph as G } from '@/lib/types';
import { EmptyState } from '@/components/primitives/EmptyState';
import { GraphIcon } from '@phosphor-icons/react';

const STYLE = [
  { selector: 'node', style: {
    'background-color': '#ffffff',
    'border-color': 'rgb(226 232 240)',
    'border-width': 1.5,
    'label': 'data(label)',
    'font-family': 'Geist Mono',
    'font-size': 10,
    'color': 'rgb(71 85 105)',
    'text-valign': 'center',
    'text-halign': 'center',
    'width': 30,
    'height': 30,
  }},
  { selector: 'node[type="task"]', style: { 'border-color': 'rgb(16 185 129)', 'background-color': 'rgb(209 250 229 / 0.5)' } },
  { selector: 'node[type="project"]', style: { 'shape': 'round-rectangle', 'width': 80, 'height': 50, 'background-color': 'white', 'font-size': 12 } },
  { selector: 'node[type="person"]', style: { 'shape': 'ellipse', 'background-color': 'rgb(254 243 199 / 0.7)', 'border-color': 'rgb(217 119 6)', 'width': 22, 'height': 22 } },
  { selector: 'node[type="tag"]', style: { 'shape': 'diamond', 'background-color': 'white', 'border-color': 'rgb(16 185 129)', 'width': 22, 'height': 22, 'font-size': 9 } },
  { selector: 'edge', style: { 'width': 1.2, 'line-color': 'rgb(148 163 184 / 0.5)', 'curve-style': 'bezier' } },
  { selector: 'edge[kind="waiting"]', style: { 'line-color': 'rgb(217 119 6 / 0.6)', 'line-style': 'dashed' } },
  { selector: 'edge[kind="tag"]', style: { 'line-color': 'rgb(16 185 129 / 0.55)' } },
];

export function GraphPage({ graph, loading }: { graph?: G; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current || !graph || graph.nodes.length === 0) return;
    const elements = [
      ...graph.nodes.map(n => ({ data: { id: n.id, label: n.label, type: n.type, ...n.meta } })),
      ...graph.edges.map((e, i) => ({ data: { id: `e${i}`, source: e.source, target: e.target, kind: e.kind } })),
    ];
    const cy = cytoscape({
      container: ref.current,
      elements,
      style: STYLE as unknown as cytoscape.StylesheetCSS[],
      layout: { name: 'cose', animate: true, padding: 50 } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.2,
    });
    cy.on('tap', 'node', e => setSelected(e.target.id()));
    cy.on('tap', evt => { if (evt.target === cy) setSelected(null); });
    return () => cy.destroy();
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
      <div ref={ref} className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} />
      <div className="absolute top-6 left-6 font-mono text-xs text-slate-500">
        <div className="text-slate-700 font-medium tracking-tight text-base">Graph</div>
        <div className="mt-1">{graph.nodes.length} nodes · {graph.edges.length} edges · cose</div>
      </div>
      <div className="absolute bottom-6 left-6 rounded-2xl bg-white border border-slate-200/70 px-4 py-3 flex items-center gap-5 text-xs">
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />task</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />project</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />person</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rotate-45 border border-emerald-500 bg-white" />tag</span>
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
