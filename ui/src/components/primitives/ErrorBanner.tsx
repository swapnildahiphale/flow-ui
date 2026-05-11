import { WarningCircle } from '@phosphor-icons/react';

export function ErrorBanner({ title, body, action }: { title: string; body: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-amber-100/70 flex items-center justify-center shrink-0">
        <WarningCircle size={22} weight="regular" className="text-amber-700" />
      </div>
      <div className="flex-1">
        <div className="text-[15px] text-slate-900 font-medium">{title}</div>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{body}</p>
        {action && (
          <button onClick={action.onClick} className="mt-3 text-[12px] text-emerald-700 hover:underline">{action.label}</button>
        )}
      </div>
    </div>
  );
}
