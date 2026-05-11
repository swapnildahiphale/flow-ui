import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { GraphCanvas, lightTheme, type GraphCanvasRef, type GraphNode as RGNode, type GraphEdge as RGEdge } from 'reagraph';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, GraphIcon } from '@phosphor-icons/react';
import type { Graph as G, Task } from '@/lib/types';
import { api } from '@/lib/api';
import { relative } from '@/lib/time';
import { EmptyState } from '@/components/primitives/EmptyState';

type NodeType = 'task' | 'project' | 'person' | 'tag';
type LayoutName = 'forceDirected2d' | 'radialOut2d' | 'circular2d';

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

const TYPE_FILL: Record<NodeType, string> = {
  task: '#10b981',     // emerald-500
  project: '#94a3b8',  // slate-400
  person: '#f59e0b',   // amber-500
  tag: '#34d399',      // emerald-400 (smaller, slightly lighter)
};

const TYPE_SIZE: Record<NodeType, number> = {
  task: 9,
  project: 16,
  person: 8,
  tag: 6,
};

const CARD_WIDTH = 288;
const CARD_HEIGHT_ESTIMATE = 200;

export function GraphPage({ graph, loading }: { graph?: G; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<GraphCanvasRef | null>(null);

  const [layout, setLayout] = useState<LayoutName>('forceDirected2d');
  const [visible, setVisible] = useState<Record<NodeType, boolean>>({ task: true, project: true, person: true, tag: true });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  // Test-only: expose focus setter on window so e2e/screenshot scripts can drive focus mode.
  useEffect(() => {
    (window as unknown as { __setFocus?: (id: string | null) => void }).__setFocus = setFocusedProjectId;
  }, []);

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

  // Compute the set of node IDs in focus when a project is anchored.
  // Includes: the project, all tasks linked via 'membership', and 1-hop neighbors of those tasks
  // (waiting_on persons, tags, assignees).
  const focusSet = useMemo(() => {
    if (!focusedProjectId || !graph) return null;
    const set = new Set<string>([focusedProjectId]);
    graph.edges.forEach(e => {
      if (e.kind === 'membership' && (e.source === focusedProjectId || e.target === focusedProjectId)) {
        const taskId = e.source === focusedProjectId ? e.target : e.source;
        set.add(taskId);
      }
    });
    // 1-hop from those tasks (and the project itself)
    const seeded = new Set(set);
    graph.edges.forEach(e => {
      if (seeded.has(e.source)) set.add(e.target);
      if (seeded.has(e.target)) set.add(e.source);
    });
    return set;
  }, [focusedProjectId, graph]);

  const DIM_FILL = '#e2e8f0';
  const DIM_EDGE = '#f1f5f9';

  const { rgNodes, rgEdges } = useMemo(() => {
    const nodes: RGNode[] = [];
    const edges: RGEdge[] = [];
    if (!graph) return { rgNodes: nodes, rgEdges: edges };

    const visibleIds = new Set<string>();
    for (const n of graph.nodes) {
      if (!visible[n.type]) continue;
      visibleIds.add(n.id);
      let label = n.label;
      if (n.type === 'project') {
        const c = projectTaskCount[n.id] ?? 0;
        label = `${n.label} · ${c} ${c === 1 ? 'task' : 'tasks'}`;
      } else if (n.type === 'person' && label.length > 16) {
        label = label.slice(0, 14) + '…';
      }
      const inFocus = !focusSet || focusSet.has(n.id);
      nodes.push({
        id: n.id,
        label,
        fill: inFocus ? TYPE_FILL[n.type] : DIM_FILL,
        size: inFocus ? TYPE_SIZE[n.type] : TYPE_SIZE[n.type] * 0.6,
        data: { type: n.type, ...(n.meta ?? {}) },
      });
    }
    let i = 0;
    for (const e of graph.edges) {
      if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) { i++; continue; }
      const edgeInFocus = !focusSet || (focusSet.has(e.source) && focusSet.has(e.target));
      const eg: RGEdge = {
        id: `e${i++}`,
        source: e.source,
        target: e.target,
      };
      if (!edgeInFocus) {
        eg.fill = DIM_EDGE;
        eg.size = 0.5;
      } else if (e.kind === 'waiting') {
        eg.fill = '#d97706';
        eg.size = 1.5;
      } else if (e.kind === 'tag') {
        eg.fill = '#10b981';
        eg.size = 1;
      } else {
        eg.fill = '#94a3b8';
        eg.size = 1;
      }
      edges.push(eg);
    }
    return { rgNodes: nodes, rgEdges: edges };
  }, [graph, visible, projectTaskCount, focusSet]);

  const onNodeClick = useCallback((node: { id: string; data?: unknown }, _props?: unknown, event?: { nativeEvent?: MouseEvent; clientX?: number; clientY?: number }) => {
    const type = (node.data as { type?: NodeType } | undefined)?.type;
    if (type === 'project') {
      setFocusedProjectId(prev => (prev === node.id ? null : node.id));
      setSelectedSlug(null);
      setCardPos(null);
      return;
    }
    if (type !== 'task') return;
    const slug = String(node.id).replace(/^task:/, '');
    setSelectedSlug(slug);

    const container = containerRef.current;
    const native = event?.nativeEvent;
    if (native && container) {
      const rect = container.getBoundingClientRect();
      setCardPos({ x: native.clientX - rect.left, y: native.clientY - rect.top });
    } else if (event?.clientX != null && container) {
      const rect = container.getBoundingClientRect();
      setCardPos({ x: event.clientX - rect.left, y: (event.clientY ?? 0) - rect.top });
    } else {
      // Fallback: center of left half (leaves room for LAYERS panel)
      const w = container?.clientWidth ?? 1200;
      const h = container?.clientHeight ?? 700;
      setCardPos({ x: Math.min(w / 2, w - 320), y: h / 2 });
    }
  }, []);

  const onCanvasClick = useCallback(() => {
    setSelectedSlug(null);
    setCardPos(null);
    setFocusedProjectId(null);
  }, []);

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
      className="relative h-[calc(100dvh-57px)] overflow-hidden bg-white"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)', backgroundSize: '28px 28px' }}
    >
      <div ref={containerRef} className="absolute inset-0">
        <GraphCanvas
          ref={canvasRef}
          nodes={rgNodes}
          edges={rgEdges}
          layoutType={layout}
          draggable
          theme={{
            ...lightTheme,
            canvas: { background: '#ffffff' },
            node: {
              ...lightTheme.node,
              label: {
                ...lightTheme.node.label,
                color: '#475569',
                stroke: '#ffffff',
                activeColor: '#0f172a',
              },
            },
            edge: {
              ...lightTheme.edge,
              fill: '#94a3b8',
              activeFill: '#10b981',
            },
          }}
          onNodeClick={onNodeClick}
          onCanvasClick={onCanvasClick}
          cameraMode="pan"
        />
      </div>

      {/* Top-left counts */}
      <div className="absolute top-6 left-6 font-mono text-xs text-slate-500 pointer-events-none">
        <div className="text-slate-700 font-medium tracking-tight text-base">Graph</div>
        <div className="mt-1">{graph.nodes.length} nodes · {graph.edges.length} edges · reagraph</div>
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
            {([
              ['forceDirected2d', 'force'],
              ['radialOut2d', 'radial'],
              ['circular2d', 'circle'],
            ] as [LayoutName, string][]).map(([name, label]) => (
              <button
                key={name}
                onClick={() => setLayout(name)}
                className={`flex-1 px-3 py-1 rounded-full transition-colors ${
                  layout === name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
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
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" />tag</span>
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
  return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
}
