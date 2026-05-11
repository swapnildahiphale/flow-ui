import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

// Handles are required for edges to attach. Render them invisibly at top+bottom.
// React Flow allows a handle to act as both source/target if its `type` matches the edge — but
// the simplest approach is to expose one source + one target per node.
const handleStyle: React.CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  opacity: 0,
  background: 'transparent',
  border: 'none',
  pointerEvents: 'none',
};

function HandlesTB() {
  return (
    <>
      <Handle type="target" position={Position.Top} style={handleStyle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} isConnectable={false} />
    </>
  );
}

type TaskData = { label: string; stale?: boolean };
export const TaskNode = memo(function TaskNode({ data, selected }: NodeProps & { data: TaskData }) {
  const stale = !!data.stale;
  const borderColor = stale ? 'border-amber-600' : 'border-emerald-500';
  return (
    <div className="flex flex-col items-center" style={{ width: 60 }}>
      <div
        className={`rounded-full bg-white ${borderColor} transition-all`}
        style={{
          width: selected ? 26 : 22,
          height: selected ? 26 : 22,
          borderWidth: selected ? 3 : 2,
          borderStyle: 'solid',
          boxShadow: selected ? '0 0 0 8px rgba(16,185,129,0.18)' : undefined,
        }}
      />
      <div
        className="mt-1.5 text-[11px] font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded whitespace-nowrap"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.6)' }}
      >
        {data.label}
      </div>
      <HandlesTB />
    </div>
  );
});

type ProjectData = { label: string; count: number };
export const ProjectNode = memo(function ProjectNode({ data, selected }: NodeProps & { data: ProjectData }) {
  return (
    <div
      className={`rounded-2xl bg-white border px-3 py-2 ${selected ? 'border-slate-400' : 'border-slate-200'}`}
      style={{ width: 110 }}
    >
      <div className="text-[13px] text-slate-900 font-medium leading-tight">{data.label}</div>
      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
        {data.count} {data.count === 1 ? 'task' : 'tasks'}
      </div>
      <HandlesTB />
    </div>
  );
});

type PersonData = { label: string };
export const PersonNode = memo(function PersonNode({ data }: NodeProps & { data: PersonData }) {
  const label = data.label.length > 16 ? data.label.slice(0, 14) + '…' : data.label;
  return (
    <div className="flex flex-col items-center" style={{ width: 60 }}>
      <div
        className="rounded-full bg-amber-50 border border-amber-600/50"
        style={{ width: 22, height: 22 }}
      />
      <div className="mt-1.5 text-[11px] text-amber-900 bg-white px-1.5 py-0.5 rounded whitespace-nowrap">
        {label}
      </div>
      <HandlesTB />
    </div>
  );
});

type TagData = { label: string };
export const TagNode = memo(function TagNode({ data }: NodeProps & { data: TagData }) {
  return (
    <div className="flex flex-col items-center" style={{ width: 60 }}>
      <div className="flex items-center justify-center" style={{ width: 22, height: 22 }}>
        <div
          className="bg-white border border-emerald-500/60"
          style={{ width: 22, height: 22, transform: 'rotate(45deg)' }}
        />
      </div>
      <div className="mt-1.5 text-[10px] font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded whitespace-nowrap">
        #{data.label}
      </div>
      <HandlesTB />
    </div>
  );
});

export const nodeTypes = {
  task: TaskNode,
  project: ProjectNode,
  person: PersonNode,
  tag: TagNode,
};
