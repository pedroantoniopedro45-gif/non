import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="h-11 w-11 rounded-2xl bg-brand-800 text-white flex items-center justify-center shadow-[0_8px_16px_rgba(22,101,52,0.16)] shrink-0">
            {icon}
          </div>
        )}
        <div>
          <p className="eyebrow">AVICONTROL PRO</p>
          <h2 className="text-2xl font-extrabold text-brand-950 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
