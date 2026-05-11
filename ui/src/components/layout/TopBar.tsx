import { MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/primitives/Button';

export function TopBar({ onOpenCmdK, sidebarWidth }: { onOpenCmdK: () => void; sidebarWidth: number }) {
  const collapsed = sidebarWidth < 100;
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/75 border-b border-slate-200/60">
      <div className="flex items-center py-3">
        <div
          className="shrink-0 flex justify-center transition-[width] duration-300 ease-out"
          style={{ width: sidebarWidth }}
        >
          <a href="/" className="flex items-center" aria-label="flow·ui home">
            <img
              src={collapsed ? '/flow-ui-icon.png' : '/flow-ui-logo.png'}
              alt="flow·ui"
              className="h-7 w-auto"
            />
          </a>
        </div>
        <div className="flex-1 min-w-0 px-6 flex items-center">
          <Button variant="secondary" onClick={onOpenCmdK} className="ml-auto">
            <MagnifyingGlass size={14} weight="regular" />
            Search<span className="font-mono text-[11px] text-slate-400 ml-1">⌘K</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
