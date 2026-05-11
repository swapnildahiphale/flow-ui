export function CmdK({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm" />;
}
