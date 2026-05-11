import { MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/primitives/Button';

export function TopBar({ onOpenCmdK }: { onOpenCmdK: () => void }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/75 border-b border-slate-200/60">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-6">
        <div className="flex items-baseline gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 breath" />
            <span className="text-[15px] font-semibold tracking-tight">flow<span className="text-emerald-700">·</span>ui</span>
          </span>
        </div>
        <Button variant="secondary" onClick={onOpenCmdK} className="ml-auto">
          <MagnifyingGlass size={14} weight="regular" />
          Search<span className="font-mono text-[11px] text-slate-400 ml-1">⌘K</span>
        </Button>
      </div>
    </header>
  );
}
