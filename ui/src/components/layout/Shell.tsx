import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CmdK } from '@/components/cmdk/CmdK';

export function Shell({ children }: { children: ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('flow-ui:sb') === 'collapsed'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('flow-ui:sb', collapsed ? 'collapsed' : 'expanded'); } catch {}
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebarWidth = collapsed ? 64 : 230;

  return (
    <>
      <TopBar onOpenCmdK={() => setCmdkOpen(true)} sidebarWidth={sidebarWidth} />
      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <CmdK open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
    </>
  );
}
