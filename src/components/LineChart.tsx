interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  yLabel?: string;
  metaLine?: { label: string; values: number[] };
}

export default function LineChart({
  data,
  color = '#16a34a',
  height = 200,
  yLabel,
  metaLine,
}: LineChartProps) {
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

  const padLeft = 48;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const w = 100;
  const h = 100;

  const allValues = data.map((d) => d.value);
  if (metaLine) allValues.push(...metaLine.values);
  const maxVal = Math.max(...allValues, 1) * 1.15;
  const minVal = 0;

  const scaleX = (i: number) =>
    padLeft + (i / Math.max(1, data.length - 1)) * (w - padLeft - padRight);
  const scaleY = (v: number) =>
    h - padBottom - ((v - minVal) / (maxVal - minVal)) * (h - padTop - padBottom);

  const points = data.map((d, i) => `${scaleX(i)},${scaleY(d.value)}`).join(' ');

  // Meta line: map metaLine values to same x positions if same length
  const metaPoints =
    metaLine && metaLine.values.length > 0
      ? metaLine.values
          .map((v, i) => {
            const x = scaleX(i);
            const y = scaleY(v);
            return `${x},${y}`;
          })
          .join(' ')
      : null;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minVal + t * (maxVal - minVal));

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height }}
      preserveAspectRatio="none"
    >
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            y1={scaleY(tick)}
            x2={w - padRight}
            y2={scaleY(tick)}
            stroke="#e2e8f0"
            strokeWidth="0.3"
          />
          <text
            x={padLeft - 4}
            y={scaleY(tick) + 1}
            textAnchor="end"
            fontSize="3"
            fill="#94a3b8"
          >
            {tick < 10 ? tick.toFixed(1) : tick.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Meta line */}
      {metaPoints && (
        <>
          <polyline
            points={metaPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        </>
      )}

      {/* Data line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={scaleX(i)}
          cy={scaleY(d.value)}
          r="0.8"
          fill={color}
        />
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={scaleX(i)}
          y={h - padBottom + 4}
          textAnchor="middle"
          fontSize="3"
          fill="#64748b"
        >
          {d.label}
        </text>
      ))}

      {yLabel && (
        <text
          x={padLeft - 4}
          y={padTop - 2}
          textAnchor="end"
          fontSize="3"
          fill="#94a3b8"
        >
          {yLabel}
        </text>
      )}
    </svg>
  );
}
