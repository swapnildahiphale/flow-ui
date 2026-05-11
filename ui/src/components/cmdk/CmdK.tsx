import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { MagnifyingGlass, ArrowBendDownLeft, FolderOpen, BookOpen } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { Chip } from '@/components/primitives/Chip';

type Result =
  | { kind: 'task'; slug: string; name: string; status: string }
  | { kind: 'project'; slug: string; name: string }
  | { kind: 'kb'; name: string };

export function CmdK({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const tasks    = useQuery({ queryKey: ['tasks','cmdk'],    queryFn: () => api.tasks(),    enabled: open });
  const projects = useQuery({ queryKey: ['projects','cmdk'], queryFn: api.projects,         enabled: open });
  const kb       = useQuery({ queryKey: ['kb','cmdk'],       queryFn: api.kbList,           enabled: open });

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);
  useEffect(() => { setIdx(0); }, [q]);

  if (!open) return null;

  const ql = q.trim().toLowerCase();
  const taskMatches = (tasks.data?.tasks ?? [])
    .filter(t => !ql || t.slug.toLowerCase().includes(ql) || t.name.toLowerCase().includes(ql))
    .slice(0, 6).map(t => ({ kind: 'task' as const, slug: t.slug, name: t.name, status: t.status }));
  const projectMatches = (projects.data?.projects ?? [])
    .filter(p => !ql || p.slug.toLowerCase().includes(ql) || p.name.toLowerCase().includes(ql))
    .slice(0, 4).map(p => ({ kind: 'project' as const, slug: p.slug, name: p.name }));
  const kbMatches = (kb.data?.files ?? [])
    .filter(f => !ql || f.name.toLowerCase().includes(ql))
    .map(f => ({ kind: 'kb' as const, name: f.name }));
  const results: Result[] = [...taskMatches, ...projectMatches, ...kbMatches];

  function activate(r: Result) {
    onClose();
    if (r.kind === 'task') nav({ to: '/tasks/$slug', params: { slug: r.slug } });
    if (r.kind === 'project') nav({ to: '/projects/$slug', params: { slug: r.slug } });
    if (r.kind === 'kb') nav({ to: '/kb/$file', params: { file: r.name } });
  }

  return (
    <div className="fixed inset-0 z-50" onKeyDown={e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { setIdx(i => Math.min(i + 1, results.length - 1)); e.preventDefault(); }
      if (e.key === 'ArrowUp')   { setIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === 'Enter' && results[idx]) { activate(results[idx]); e.preventDefault(); }
    }}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-[18%] -translate-x-1/2 w-[640px] max-w-[92vw]">
        <div className="rounded-3xl overflow-hidden border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_60px_-20px_rgba(15,23,42,0.18)]"
             style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(140%)' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/60">
            <MagnifyingGlass size={18} weight="regular" className="text-slate-400" />
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} className="flex-1 bg-transparent outline-none text-[15px] placeholder-slate-400" placeholder="Jump to a task, project, KB entry…" />
            <span className="font-mono text-[11px] text-slate-400">esc</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {taskMatches.length > 0 && <Group label="Tasks">
              {taskMatches.map((r, i) => (
                <Row key={r.slug} active={i === idx} onClick={() => activate(r)}>
                  <span className="live-dot w-2 h-2 rounded-full shrink-0" />
                  <span className="font-mono text-[12px] text-emerald-700 font-medium shrink-0">{r.slug}</span>
                  <span className="text-[14px] text-slate-900 truncate">{r.name}</span>
                  <Chip variant="accent" className="ml-auto">{r.status}</Chip>
                </Row>
              ))}
            </Group>}
            {projectMatches.length > 0 && <Group label="Projects">
              {projectMatches.map((r, i) => (
                <Row key={r.slug} active={taskMatches.length + i === idx} onClick={() => activate(r)}>
                  <FolderOpen size={14} className="text-slate-400" />
                  <span className="text-[14px] text-slate-800">{r.name}</span>
                </Row>
              ))}
            </Group>}
            {kbMatches.length > 0 && <Group label="Knowledge base">
              {kbMatches.map((r, i) => (
                <Row key={r.name} active={taskMatches.length + projectMatches.length + i === idx} onClick={() => activate(r)}>
                  <BookOpen size={14} className="text-slate-400" />
                  <span className="text-[14px] text-slate-800">{r.name}.md</span>
                </Row>
              ))}
            </Group>}
            {results.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No matches.</div>}
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200/60 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span className="font-mono">↑↓</span> navigate</span>
              <span className="inline-flex items-center gap-1"><ArrowBendDownLeft size={12} /> open</span>
            </div>
            <span className="font-mono">flow-ui</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (<>
    <div className="px-5 pt-4 pb-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
    <ul className="px-2 pb-2">{children}</ul>
  </>);
}

function Row({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button type="button" onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${active ? 'bg-emerald-100/55' : 'hover:bg-slate-100/60'}`}>
        {children}
      </button>
    </li>
  );
}
