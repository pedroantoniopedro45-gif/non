interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function BarChart({
  data,
  color = '#16a34a',
  height = 200,
  formatValue,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-neutral-400"
        style={{ height }}
      >
        Sem dados para mostrar
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 w-24 truncate text-right">
            {d.label}
          </span>
          <div className="flex-1 bg-neutral-100 rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                backgroundColor: color,
                minWidth: d.value > 0 ? '2rem' : '0',
              }}
            >
              {d.value > 0 && (
                <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
