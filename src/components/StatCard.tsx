import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  color?: 'brand' | 'neutral' | 'danger' | 'warning' | 'info';
}

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  color = 'neutral',
}: StatCardProps) {
  const colorMap = {
    brand: 'bg-brand-100 text-brand-800',
    neutral: 'bg-neutral-100 text-neutral-700',
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-sky-100 text-sky-700',
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span
            className={`p-1.5 rounded-lg ${colorMap[color]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <span className="text-2xl font-bold text-neutral-800 tabular-nums">
        {value}
      </span>
      {sublabel && (
        <span className="text-xs text-neutral-500">{sublabel}</span>
      )}
    </div>
  );
}
