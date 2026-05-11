import { useState, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { House, ListChecks, FolderOpen, BookOpen, Clock, GraphIcon as GraphI, PlayCircle, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { clsx } from '@/lib/clsx';

const NAV = [
  { to: '/',          label: 'Overview',       icon: House },
  { to: '/tasks',     label: 'Tasks',          icon: ListChecks },
  { to: '/projects',  label: 'Projects',       icon: FolderOpen },
  { to: '/kb',        label: 'Knowledge base', icon: BookOpen },
  { to: '/timeline',  label: 'Timeline',       icon: Clock },
  { to: '/graph',     label: 'Graph',          icon: GraphI },
  { to: '/playbooks', label: 'Playbooks',      icon: PlayCircle },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('flow-ui:sb') === 'collapsed'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('flow-ui:sb', collapsed ? 'collapsed' : 'expanded'); } catch {}
  }, [collapsed]);

  const path = useRouterState({ select: s => s.location.pathname });

  return (
    <aside
      className="shrink-0 sticky top-[57px] h-[calc(100dvh-57px)] py-6 px-3 border-r border-slate-200/60 bg-white/40 backdrop-blur-sm transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 64 : 230 }}
    >
      <div className="px-3 mb-6 flex items-center justify-between">
        {!collapsed && <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">workspace</span>}
        <button onClick={() => setCollapsed(c => !c)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100 ml-auto" aria-label="Toggle sidebar">
          {collapsed ? <CaretRight size={14} /> : <CaretLeft size={14} />}
        </button>
      </div>

      <ul className="space-y-1 px-1">
        {NAV.map(item => {
          const active = path === item.to || (item.to !== '/' && path.startsWith(item.to));
          return (
            <li key={item.to} className="relative">
              <a
                href={item.to}
                className={clsx(
                  'relative flex items-center gap-3 px-3 py-2 rounded-xl transition-colors',
                  active ? 'bg-emerald-100/55 text-emerald-700' : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                )}
              >
                <item.icon size={18} weight="regular" className="shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {active && <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-sm bg-emerald-500" />}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
