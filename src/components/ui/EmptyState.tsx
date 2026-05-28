import type { LucideIcon } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
}: Props) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-bg-elevated/60 border border-bg-border flex items-center justify-center mx-auto mb-3">
          <Icon size={24} className="text-ink-dim" />
        </div>
      )}
      {emoji && <div className="text-4xl mb-3 opacity-50">{emoji}</div>}
      <div className="text-sm font-semibold text-ink mb-1">{title}</div>
      {description && (
        <div className="text-xs text-ink-muted max-w-xs mx-auto">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
