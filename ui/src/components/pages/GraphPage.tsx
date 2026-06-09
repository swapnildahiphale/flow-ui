import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods, type NodeObject } from 'react-force-graph-2d';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, GraphIcon } from '@phosphor-icons/react';
import type { Graph as G, Task } from '@/lib/types';
import { api } from '@/lib/api';
import { relative } from '@/lib/time';
import { EmptyState } from '@/components/primitives/EmptyState';
import { buildForceData, type FNode } from '@/lib/graph-data';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const LABEL_ZOOM = 1.1; // global scale at which labels start fading in

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

const CARD_WIDTH = 288;
const CARD_HEIGHT_ESTIMATE = 200;

function useElementSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function GraphInner({ graph }: { graph: G }) {
  const [layout, setLayout] = useState<LayoutName>('cose');
  const [visible, setVisible] = useState<Record<NodeType, boolean>>({
    task: true,
    project: true,
    person: true,
    tag: true,
  });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  const { ref: wrapRef, size } = useElementSize();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const hoverIdsRef = useRef<Set<string> | null>(null);

  const { nodes: allNodes, links: allLinks } = useMemo(() => buildForceData(graph), [graph]);
  const data = useMemo(() => ({ nodes: allNodes, links: allLinks }), [allNodes, allLinks]);

  const drawNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as unknown as FNode;
      const r = n.radius;
      const x = n.x ?? 0;
      const y = n.y ?? 0;

      // shape per type
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = n.stroke;
      if (n.type === 'project') {
        const s = r * 1.6;
        roundRect(ctx, x - s, y - s * 0.7, s * 2, s * 1.4, 4);
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      } else if (n.type === 'tag') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.strokeRect(-r, -r, r * 2, r * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.type === 'person' ? '#fffbeb' : '#ffffff';
        ctx.fill(); ctx.stroke();
      }

      // label: always for projects; for others fade in with zoom, or when highlighted
      const highlighted = hoverIdsRef.current?.has(n.id) ?? false;
      let alpha = 0;
      if (n.type === 'project' || highlighted) alpha = 1;
      else alpha = clamp((globalScale - LABEL_ZOOM) / 0.6, 0, 1);
      if (alpha > 0.02) {
        const fontSize = (n.type === 'project' ? 12 : 11) / globalScale;
        ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const text = n.type === 'tag' ? `#${n.label}` : n.label;
        const labelColor =
          n.type === 'person' ? '#92400e' : n.type === 'tag' ? '#065f46' : '#0f172a';
        // soft white plate behind text for legibility
        const tw = ctx.measureText(text).width;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(x - tw / 2 - 2 / globalScale, y + r + 1 / globalScale, tw + 4 / globalScale, fontSize + 2 / globalScale);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = labelColor;
        ctx.fillText(text, x, y + r + 2 / globalScale);
        ctx.globalAlpha = 1;
      }
    },
    []
  );

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

  const toggleLayer = (type: NodeType) => setVisible((v) => ({ ...v, [type]: !v[type] }));

  // referenced fully in later tasks; touch here to keep the build green.
  void setSelectedSlug;
  void focusedProjectId;
  void setFocusedProjectId;

  const selectedTask = selectedSlug ? tasksBySlug.get(selectedSlug) : undefined;

  // placeholder card positioning (rewired in Task 6)
  const cardPos: { x: number; y: number } | null = null;
  let cardLeft = 0;
  let cardTop = 0;
  let cardReady = false;
  if (cardPos && selectedTask) {
    const p = cardPos as { x: number; y: number };
    cardLeft = p.x - 28;
    cardTop = p.y - 12;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (cardLeft + CARD_WIDTH > w - 24) cardLeft = p.x - CARD_WIDTH + 28;
    if (cardTop + CARD_HEIGHT_ESTIMATE > h - 24) cardTop = p.y - CARD_HEIGHT_ESTIMATE + 12;
    if (cardLeft < 24) cardLeft = 24;
    if (cardTop < 24) cardTop = 24;
    cardReady = true;
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-[calc(100dvh-57px)] overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      {size.w > 0 && size.h > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={data}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={5}
          nodeVal={(n) => { const r = (n as unknown as FNode).radius; return (r * r) / 25; }}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as unknown as FNode;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, n.radius + 2, 0, Math.PI * 2);
            ctx.fill();
          }}
          cooldownTicks={120}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 40)}
        />
      )}

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
  return <GraphInner graph={graph} />;
}

function LayerSwatch({ type }: { type: NodeType }) {
  if (type === 'task') return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />;
  if (type === 'project') return <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />;
  if (type === 'person') return <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />;
  return <span className="w-2.5 h-2.5 rotate-45 border border-emerald-500 bg-white" />;
}
