import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, GraphIcon } from '@phosphor-icons/react';
import type { Graph as G, Task } from '@/lib/types';
import { api } from '@/lib/api';
import { relative } from '@/lib/time';
import { EmptyState } from '@/components/primitives/EmptyState';
import { nodeTypes } from '@/components/graph/nodes';

type NodeType = 'task' | 'project' | 'person' | 'tag';
type LayoutName = 'cose' | 'grid' | 'circle';

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

const NODE_DIM: Record<NodeType, { w: number; h: number }> = {
  task: { w: 60, h: 44 },
  project: { w: 120, h: 64 },
  person: { w: 60, h: 44 },
  tag: { w: 60, h: 44 },
};

const CARD_WIDTH = 288;
const CARD_HEIGHT_ESTIMATE = 200;

function layoutDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 90, marginx: 40, marginy: 40 });
  nodes.forEach((n) => {
    const dim = NODE_DIM[(n.type ?? 'task') as NodeType] ?? NODE_DIM.task;
    g.setNode(n.id, { width: dim.w, height: dim.h });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    if (!p) return n;
    return {
      ...n,
      position: { x: p.x - p.width / 2, y: p.y - p.height / 2 },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });
}

function layoutGrid(nodes: Node[]): Node[] {
  const colsByType: Record<NodeType, number> = { project: 0, task: 1, person: 2, tag: 3 };
  const buckets: Record<NodeType, Node[]> = { task: [], project: [], person: [], tag: [] };
  nodes.forEach((n) => buckets[(n.type as NodeType) ?? 'task'].push(n));
  const colW = 220;
  const rowH = 90;
  const placed: Node[] = [];
  (Object.keys(buckets) as NodeType[]).forEach((t) => {
    const col = colsByType[t];
    buckets[t].forEach((n, i) => {
      placed.push({
        ...n,
        position: { x: col * colW, y: i * rowH },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      });
    });
  });
  return placed;
}

function layoutCircle(nodes: Node[]): Node[] {
  const r = Math.max(220, nodes.length * 22);
  const cx = r;
  const cy = r;
  return nodes.map((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    return {
      ...n,
      position: { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });
}

function buildElements(graph: G): { nodes: Node[]; edges: Edge[]; projectCounts: Record<string, number> } {
  const projectCounts: Record<string, number> = {};
  graph.edges.forEach((e) => {
    if (e.kind === 'membership') projectCounts[e.target] = (projectCounts[e.target] ?? 0) + 1;
  });
  const nodes: Node[] = graph.nodes.map((n) => {
    const base = {
      id: n.id,
      type: n.type,
      position: { x: 0, y: 0 },
      data: {} as Record<string, unknown>,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      draggable: true,
    } as Node;
    if (n.type === 'project') {
      base.data = { label: n.label, count: projectCounts[n.id] ?? 0 };
    } else if (n.type === 'task') {
      const stale = !!(n.meta && (n.meta as { stale?: boolean }).stale);
      base.data = { label: n.label, stale };
    } else {
      base.data = { label: n.label };
    }
    return base;
  });
  const edges: Edge[] = graph.edges.map((e, i) => {
    const baseStyle: React.CSSProperties =
      e.kind === 'waiting'
        ? { stroke: '#d97706', strokeDasharray: '6 4', strokeWidth: 1.5, opacity: 0.85 }
        : e.kind === 'tag'
        ? { stroke: '#10b981', strokeOpacity: 0.55, strokeWidth: 1.2 }
        : { stroke: '#94a3b8', strokeOpacity: 0.5, strokeWidth: 1.2 };
    return {
      id: `e${i}`,
      source: e.source,
      target: e.target,
      type: 'default',
      data: { kind: e.kind },
      style: baseStyle,
    };
  });
  return { nodes, edges, projectCounts };
}

function GraphInner({ graph }: { graph: G }) {
  const { nodes: initNodes, edges: initEdges } = useMemo(() => buildElements(graph), [graph]);

  const [layout, setLayout] = useState<LayoutName>('cose');
  const [visible, setVisible] = useState<Record<NodeType, boolean>>({
    task: true,
    project: true,
    person: true,
    tag: true,
  });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { flowToScreenPosition, getNode } = useReactFlow();
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);

  // Initial layout + relayout on layout change.
  useEffect(() => {
    let laid: Node[];
    if (layout === 'cose') laid = layoutDagre(initNodes, initEdges);
    else if (layout === 'grid') laid = layoutGrid(initNodes);
    else laid = layoutCircle(initNodes);
    setNodes(laid);
    setEdges(initEdges);
  }, [layout, initNodes, initEdges, setNodes, setEdges]);

  const tasksQ = useQuery({ queryKey: ['tasks-all'], queryFn: () => api.tasks({}) });
  const tasksBySlug = useMemo(() => {
    const m = new Map<string, Task>();
    tasksQ.data?.tasks.forEach((t) => m.set(t.slug, t));
    return m;
  }, [tasksQ.data]);

  const layerCounts = useMemo(() => {
    const c: Record<NodeType, number> = { task: 0, project: 0, person: 0, tag: 0 };
    graph.nodes.forEach((n) => {
      c[n.type]++;
    });
    return c;
  }, [graph]);

  // Apply visibility filtering.
  const visibleNodes = useMemo(
    () => nodes.filter((n) => visible[(n.type as NodeType) ?? 'task']),
    [nodes, visible]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [edges, visibleIds]
  );

  // Re-position the detail card based on selected task's screen position.
  const updateCardPos = useCallback(() => {
    if (!selectedSlug) {
      setCardPos(null);
      return;
    }
    const id = `task:${selectedSlug}`;
    const n = getNode(id);
    if (!n) {
      setCardPos(null);
      return;
    }
    // Node center in flow coordinates.
    const dim = NODE_DIM.task;
    const center = { x: n.position.x + dim.w / 2, y: n.position.y + 12 };
    const screen = flowToScreenPosition(center);
    setCardPos(screen);
  }, [selectedSlug, getNode, flowToScreenPosition]);

  useEffect(() => {
    updateCardPos();
  }, [updateCardPos, nodes]);

  const onMove = useCallback(
    (_e: unknown, _v: Viewport) => {
      updateCardPos();
    },
    [updateCardPos]
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, n: Node) => {
      if (n.type !== 'task') return;
      const slug = n.id.replace(/^task:/, '');
      setSelectedSlug(slug);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedSlug(null);
    setCardPos(null);
  }, []);

  const toggleLayer = (type: NodeType) => setVisible((v) => ({ ...v, [type]: !v[type] }));

  const selectedTask = selectedSlug ? tasksBySlug.get(selectedSlug) : undefined;

  // Adjust card to viewport bounds + container.
  let cardLeft = 0;
  let cardTop = 0;
  let cardReady = false;
  if (cardPos && selectedTask) {
    // cardPos is in screen coordinates. We want it relative to the page root.
    cardLeft = cardPos.x - 28;
    cardTop = cardPos.y - 12;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (cardLeft + CARD_WIDTH > w - 24) cardLeft = cardPos.x - CARD_WIDTH + 28;
    if (cardTop + CARD_HEIGHT_ESTIMATE > h - 24) cardTop = cardPos.y - CARD_HEIGHT_ESTIMATE + 12;
    if (cardLeft < 24) cardLeft = 24;
    if (cardTop < 24) cardTop = 24;
    cardReady = true;
  }

  return (
    <div
      className="relative h-[calc(100dvh-57px)] overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMove={onMove}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        panOnDrag
        zoomOnScroll
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'default' }}
      >
        <Background gap={28} size={1} color="#94a3b8" />
      </ReactFlow>

      {/* Top-left counts */}
      <div className="absolute top-6 left-6 font-mono text-xs text-slate-500 pointer-events-none">
        <div className="text-slate-700 font-medium tracking-tight text-base">Graph</div>
        <div className="mt-1">
          {graph.nodes.length} nodes · {graph.edges.length} edges · {layout}
        </div>
      </div>

      {/* Right-side LAYERS + LAYOUT panel */}
      <div
        className="absolute top-6 right-6 w-72 rounded-3xl p-5 border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_60px_-20px_rgba(15,23,42,0.18)]"
        style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(140%)' }}
      >
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-600 mb-4">Layers</div>
        <ul className="space-y-2.5 text-sm">
          {(Object.keys(LAYER_LABELS) as NodeType[]).map((type) => (
            <li key={type}>
              <button
                onClick={() => toggleLayer(type)}
                className={`w-full flex items-center justify-between py-0.5 transition-opacity ${
                  visible[type] ? '' : 'opacity-40'
                }`}
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
            {(['cose', 'grid', 'circle'] as LayoutName[]).map((name) => (
              <button
                key={name}
                onClick={() => setLayout(name)}
                className={`flex-1 px-3 py-1 rounded-full transition-colors ${
                  layout === name
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />task
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />project
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />person
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rotate-45 border border-emerald-500 bg-white" />tag
        </span>
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
              <div className="font-mono text-[12px] text-emerald-700 font-medium truncate">
                {selectedTask.slug}
              </div>
              <div className="text-[14px] text-slate-900 leading-tight mt-1">{selectedTask.name}</div>
            </div>
            <span
              className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${STATUS_PILL[selectedTask.status]}`}
            >
              {STATUS_LABEL[selectedTask.status]}
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            {selectedTask.project_slug && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">project</span>
                <span className="text-slate-800 text-right">{selectedTask.project_slug}</span>
              </div>
            )}
            {selectedTask.waiting_on && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">waiting</span>
                <span className="text-amber-700 text-right break-words min-w-0">
                  {selectedTask.waiting_on}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-slate-500 shrink-0">updated</span>
              <span className="font-mono text-slate-700 text-right">
                {relative(selectedTask.updated_at)}
              </span>
            </div>
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

export function GraphPage({ graph, loading }: { graph?: G; loading: boolean }) {
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
  return (
    <ReactFlowProvider>
      <GraphInner graph={graph} />
    </ReactFlowProvider>
  );
}

function LayerSwatch({ type }: { type: NodeType }) {
  if (type === 'task') return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />;
  if (type === 'project') return <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />;
  if (type === 'person') return <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />;
  return <span className="w-2.5 h-2.5 rotate-45 border border-emerald-500 bg-white" />;
}
