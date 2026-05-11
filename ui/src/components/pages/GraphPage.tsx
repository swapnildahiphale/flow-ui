import { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from '@phosphor-icons/react';
import type { Graph as G, Task } from '@/lib/types';
import { api } from '@/lib/api';
import { relative } from '@/lib/time';
import { EmptyState } from '@/components/primitives/EmptyState';
import { GraphIcon } from '@phosphor-icons/react';

type NodeType = 'task' | 'project' | 'person' | 'tag';
type LayoutName = 'cose' | 'grid' | 'circle';

const STYLE: cytoscape.StylesheetCSS[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#ffffff',
      'border-color': '#e2e8f0',
      'border-width': 1.5,
      'label': 'data(label)',
      'font-family': 'Geist Mono, ui-monospace',
      'font-size': 10,
      'color': '#475569',
      'text-valign': 'center',
      'text-halign': 'center',
      'width': 30,
      'height': 30,
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'node[type="task"]',
    style: {
      'shape': 'ellipse',
      'background-color': '#ffffff',
      'border-color': '#10b981',
      'border-width': 2,
      'width': 22,
      'height': 22,
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'color': '#0f172a',
      'font-size': 11,
      'font-family': 'Geist Mono, ui-monospace',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.85,
      'text-background-padding': '3px',
      'text-background-shape': 'round-rectangle',
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'node[type="task"][?stale]',
    style: {
      'border-color': '#d97706',
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'node[type="task"]:selected',
    style: {
      'border-width': 3,
      'width': 26,
      'height': 26,
      'overlay-color': '#10b981',
      'overlay-opacity': 0.18,
      'overlay-padding': 8,
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'node[type="project"]',
    style: {
      'shape': 'round-rectangle',
      'width': 100,
      'height': 56,
      'background-color': '#ffffff',
      'border-color': '#cbd5e1',
      'border-width': 1.5,
      'color': '#0f172a',
      'font-size': 12,
      'font-family': 'Geist, ui-sans-serif',
      'text-wrap': 'wrap',
      'text-max-width': '90',
      'line-height': 1.25,
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'node[type="person"]',
    style: {
      'shape': 'ellipse',
      'width': 22,
      'height': 22,
      'background-color': '#fef3c7',
      'background-opacity': 0.85,
      'border-color': '#d97706',
      'border-opacity': 0.5,
      'border-width': 1.5,
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'color': '#78350f',
      'font-size': 11,
      'font-family': 'Geist, ui-sans-serif',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.85,
      'text-background-padding': '3px',
      'text-background-shape': 'round-rectangle',
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'node[type="tag"]',
    style: {
      'shape': 'diamond',
      'width': 20,
      'height': 20,
      'background-color': '#ffffff',
      'border-color': '#10b981',
      'border-opacity': 0.6,
      'border-width': 1.5,
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'color': '#065f46',
      'font-size': 10,
      'font-family': 'Geist Mono, ui-monospace',
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.85,
      'text-background-padding': '3px',
      'text-background-shape': 'round-rectangle',
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'edge',
    style: {
      'width': 1.2,
      'line-color': '#94a3b8',
      'line-opacity': 0.5,
      'curve-style': 'bezier',
      'target-arrow-shape': 'none',
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'edge[kind="waiting"]',
    style: {
      'line-color': '#d97706',
      'line-opacity': 0.7,
      'line-style': 'dashed',
      'line-dash-pattern': [6, 4],
      'width': 1.5,
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: 'edge[kind="tag"]',
    style: {
      'line-color': '#10b981',
      'line-opacity': 0.55,
    },
  } as unknown as cytoscape.StylesheetCSS,
  {
    selector: '.faded',
    style: {
      'opacity': 0.12,
      'text-opacity': 0.3,
    },
  } as unknown as cytoscape.StylesheetCSS,
];

const LAYER_LABELS: Record<NodeType, string> = {
  task: 'Tasks',
  project: 'Projects',
  person: 'People',
  tag: 'Tags',
};

const STATUS_LABEL: Record<Task['status'], string> = {
  'in-progress': 'in flight',
  backlog: 'backlog',
  done: 'done',
};

const STATUS_PILL: Record<Task['status'], string> = {
  'in-progress': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  backlog: 'bg-slate-50 text-slate-700 border-slate-200',
  done: 'bg-slate-100 text-slate-500 border-slate-200',
};

const CARD_WIDTH = 288;
const CARD_HEIGHT_ESTIMATE = 200;

export function GraphPage({ graph, loading }: { graph?: G; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const selectedSlugRef = useRef<string | null>(null);
  const focusedRef = useRef<string | null>(null);

  const [layout, setLayout] = useState<LayoutName>('cose');
  const [visible, setVisible] = useState<Record<NodeType, boolean>>({ task: true, project: true, person: true, tag: true });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);

  const tasksQ = useQuery({ queryKey: ['tasks-all'], queryFn: () => api.tasks({}) });
  const tasksBySlug = useMemo(() => {
    const m = new Map<string, Task>();
    tasksQ.data?.tasks.forEach(t => m.set(t.slug, t));
    return m;
  }, [tasksQ.data]);

  const layerCounts = useMemo(() => {
    const c: Record<NodeType, number> = { task: 0, project: 0, person: 0, tag: 0 };
    graph?.nodes.forEach(n => { c[n.type]++; });
    return c;
  }, [graph]);

  const projectTaskCount = useMemo(() => {
    const counts: Record<string, number> = {};
    graph?.edges.forEach(e => {
      if (e.kind === 'membership') counts[e.target] = (counts[e.target] ?? 0) + 1;
    });
    return counts;
  }, [graph]);

  useEffect(() => { selectedSlugRef.current = selectedSlug; }, [selectedSlug]);

  useEffect(() => {
    if (!containerRef.current || !graph || graph.nodes.length === 0) return;

    const elements: cytoscape.ElementDefinition[] = [
      ...graph.nodes.map(n => {
        let label = n.label;
        if (n.type === 'project') {
          const c = projectTaskCount[n.id] ?? 0;
          label = `${n.label}\n${c} ${c === 1 ? 'task' : 'tasks'}`;
        } else if (n.type === 'person' && label.length > 16) {
          label = label.slice(0, 14) + '…';
        }
        return { data: { id: n.id, label, type: n.type, ...(n.meta ?? {}) } };
      }),
      ...graph.edges.map((e, i) => ({ data: { id: `e${i}`, source: e.source, target: e.target, kind: e.kind } })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: STYLE,
      layout: {
        name: 'cose',
        animate: true,
        padding: 60,
        idealEdgeLength: 110,
        nodeRepulsion: 8000,
        nodeOverlap: 24,
        componentSpacing: 80,
      } as cytoscape.LayoutOptions,
      autoungrabify: false,
    });
    cyRef.current = cy;

    cy.one('layoutstop', () => {
      // Leave space for the right-side LAYERS panel (~320px) and a bit on the other edges.
      cy.fit(undefined, 60);
      cy.panBy({ x: -140, y: 0 });
    });

    const onTapTask = (evt: cytoscape.EventObject) => {
      const node = evt.target;
      const slug = String(node.id()).replace(/^task:/, '');
      const p = node.renderedPosition();
      cy.elements().unselect();
      node.select();
      setSelectedSlug(slug);
      setCardPos({ x: p.x, y: p.y });
    };
    const onTapProject = (evt: cytoscape.EventObject) => {
      const projectNode = evt.target;
      const id = String(projectNode.id());
      // Toggle off if same project clicked again
      if (focusedRef.current === id) {
        cy.elements().removeClass('faded');
        focusedRef.current = null;
        return;
      }
      // Membership edges: source=task, target=project — tasks are incomers of project
      const tasks = projectNode.incomers('edge[kind="membership"]').sources();
      const tasksNeighborhood = tasks.openNeighborhood();
      const focus = projectNode
        .union(tasks)
        .union(tasksNeighborhood)
        .union(projectNode.connectedEdges())
        .union(tasks.connectedEdges());
      cy.elements().addClass('faded');
      focus.removeClass('faded');
      focusedRef.current = id;
    };
    const onTapBg = (evt: cytoscape.EventObject) => {
      if (evt.target === cy) {
        cy.elements().unselect();
        cy.elements().removeClass('faded');
        focusedRef.current = null;
        setSelectedSlug(null);
        setCardPos(null);
      }
    };
    const onViewport = () => {
      const slug = selectedSlugRef.current;
      if (!slug) return;
      const n = cy.$id(`task:${slug}`);
      if (n.nonempty()) {
        const p = n.renderedPosition();
        setCardPos({ x: p.x, y: p.y });
      }
    };

    cy.on('tap', 'node[type="task"]', onTapTask);
    cy.on('tap', 'node[type="project"]', onTapProject);
    cy.on('tap', onTapBg);
    // Expose for testing
    (window as unknown as { __cy?: cytoscape.Core }).__cy = cy;
    cy.on('pan zoom', onViewport);
    cy.on('position', 'node', (evt) => {
      const slug = selectedSlugRef.current;
      if (!slug) return;
      if (String(evt.target.id()) !== `task:${slug}`) return;
      const p = evt.target.renderedPosition();
      setCardPos({ x: p.x, y: p.y });
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, projectTaskCount]);

  // Layout switcher
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const opts: cytoscape.LayoutOptions = layout === 'cose'
      ? ({ name: 'cose', animate: true, padding: 60, idealEdgeLength: 110, nodeRepulsion: 8000, nodeOverlap: 24, componentSpacing: 80 } as cytoscape.LayoutOptions)
      : ({ name: layout, animate: true, padding: 60 } as cytoscape.LayoutOptions);
    const l = cy.layout(opts);
    l.one('layoutstop', () => { cy.fit(undefined, 60); cy.panBy({ x: -140, y: 0 }); });
    l.run();
  }, [layout]);

  // Visibility toggles
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      (Object.keys(visible) as NodeType[]).forEach(type => {
        cy.nodes(`[type="${type}"]`).style('display', visible[type] ? 'element' : 'none');
      });
    });
  }, [visible]);

  const toggleLayer = (type: NodeType) => setVisible(v => ({ ...v, [type]: !v[type] }));

  if (loading) return <div className="p-12 text-slate-400">Loading graph…</div>;
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-10 py-24">
        <EmptyState
          title="No graph yet"
          body="Create a task or project, attach a tag, or set a waiting_on note — the graph fills in as your work grows."
          icon={<GraphIcon size={48} weight="regular" className="text-slate-300" />}
        />
      </div>
    );
  }

  const selectedTask = selectedSlug ? tasksBySlug.get(selectedSlug) : undefined;
  const container = containerRef.current;
  const containerW = container?.clientWidth ?? 1200;
  const containerH = container?.clientHeight ?? 700;

  let cardLeft = 0;
  let cardTop = 0;
  let cardReady = false;
  if (cardPos) {
    cardLeft = cardPos.x - 28;
    cardTop = cardPos.y - 12;
    if (cardLeft + CARD_WIDTH > containerW - 24) cardLeft = cardPos.x - CARD_WIDTH + 28;
    if (cardTop + CARD_HEIGHT_ESTIMATE > containerH - 24) cardTop = cardPos.y - CARD_HEIGHT_ESTIMATE + 12;
    if (cardLeft < 24) cardLeft = 24;
    if (cardTop < 24) cardTop = 24;
    cardReady = true;
  }

  return (
    <div
      className="relative h-[calc(100dvh-57px)] overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)', backgroundSize: '28px 28px' }}
    >
      <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} />

      {/* Top-left counts */}
      <div className="absolute top-6 left-6 font-mono text-xs text-slate-500 pointer-events-none">
        <div className="text-slate-700 font-medium tracking-tight text-base">Graph</div>
        <div className="mt-1">{graph.nodes.length} nodes · {graph.edges.length} edges · {layout}</div>
      </div>

      {/* Right-side LAYERS + LAYOUT panel */}
      <div
        className="absolute top-6 right-6 w-72 rounded-3xl p-5 border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_60px_-20px_rgba(15,23,42,0.18)]"
        style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(140%)' }}
      >
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-600 mb-4">Layers</div>
        <ul className="space-y-2.5 text-sm">
          {(Object.keys(LAYER_LABELS) as NodeType[]).map(type => (
            <li key={type}>
              <button
                onClick={() => toggleLayer(type)}
                className={`w-full flex items-center justify-between py-0.5 transition-opacity ${visible[type] ? '' : 'opacity-40'}`}
              >
                <span className="flex items-center gap-2.5 text-slate-700">
                  <LayerSwatch type={type} />
                  {LAYER_LABELS[type]}
                </span>
                <span className="font-mono text-xs text-slate-500">{layerCounts[type]}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t border-slate-200/60">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">Layout</div>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-slate-100/70 text-[12px]">
            {(['cose', 'grid', 'circle'] as LayoutName[]).map(name => (
              <button
                key={name}
                onClick={() => setLayout(name)}
                className={`flex-1 px-3 py-1 rounded-full transition-colors ${
                  layout === name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom-left legend */}
      <div className="absolute bottom-6 left-6 rounded-2xl bg-white border border-slate-200/70 px-4 py-3 flex items-center gap-5 text-xs">
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />task</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />project</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />person</span>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rotate-45 border border-emerald-500 bg-white" />tag</span>
      </div>

      {/* Detail card */}
      {selectedTask && cardReady && (
        <div
          className="absolute w-72 rounded-2xl p-5 border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_60px_-20px_rgba(15,23,42,0.18)]"
          style={{
            left: cardLeft,
            top: cardTop,
            background: 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(20px) saturate(140%)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="font-mono text-[12px] text-emerald-700 font-medium truncate">{selectedTask.slug}</div>
              <div className="text-[14px] text-slate-900 leading-tight mt-1">{selectedTask.name}</div>
            </div>
            <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${STATUS_PILL[selectedTask.status]}`}>
              {STATUS_LABEL[selectedTask.status]}
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            {selectedTask.project_slug && (
              <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">project</span><span className="text-slate-800 text-right">{selectedTask.project_slug}</span></div>
            )}
            {selectedTask.waiting_on && (
              <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">waiting</span><span className="text-amber-700 text-right break-words min-w-0">{selectedTask.waiting_on}</span></div>
            )}
            <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">updated</span><span className="font-mono text-slate-700 text-right">{relative(selectedTask.updated_at)}</span></div>
          </div>
          <Link
            to="/tasks/$slug"
            params={{ slug: selectedTask.slug }}
            className="mt-4 w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors"
          >
            Open task <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      )}
    </div>
  );
}

function LayerSwatch({ type }: { type: NodeType }) {
  if (type === 'task') return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />;
  if (type === 'project') return <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />;
  if (type === 'person') return <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />;
  return <span className="w-2.5 h-2.5 rotate-45 border border-emerald-500 bg-white" />;
}
