import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="card p-8 flex flex-col items-center text-center gap-3">
      <div className="text-neutral-300">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="text-base font-bold text-neutral-700">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
