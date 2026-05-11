import type { ReactNode } from 'react';

export function EmptyState({ title, body, command, icon }: { title: string; body: ReactNode; command?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[2.5rem] bg-white border border-slate-200/70 p-16 flex flex-col items-center text-center shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)]">
      {icon}
      <h2 className="mt-6 text-2xl font-medium tracking-tight text-slate-900">{title}</h2>
      <p className="mt-3 text-[15px] text-slate-500 leading-relaxed max-w-[48ch]">{body}</p>
      {command && (
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/70 font-mono text-[12px] text-slate-700">
          {command}
        </div>
      )}
    </div>
  );
}
