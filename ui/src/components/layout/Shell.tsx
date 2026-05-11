import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CmdK } from '@/components/cmdk/CmdK';

export function Shell({ children }: { children: ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  return (
    <>
      <TopBar onOpenCmdK={() => setCmdkOpen(true)} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <CmdK open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
    </>
  );
}
