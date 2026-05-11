export function SparklineBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-3 bg-emerald-500 rounded-sm"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.35 + (i / values.length) * 0.65 }}
        />
      ))}
    </div>
  );
}
