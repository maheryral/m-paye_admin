import type { LucideIcon } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'cyan';
  /** Si true, applique un style "actif" (bordure colorée pleine) */
  active?: boolean;
  onClick?: () => void;
}

const TONES = {
  brand: {
    bg: 'bg-brand-500/10',
    text: 'text-brand-300',
    border: 'border-brand-500/20',
    activeBorder: 'border-brand-500/60 bg-brand-500/20',
  },
  success: {
    bg: 'bg-success-bg',
    text: 'text-success-500',
    border: 'border-success-500/20',
    activeBorder: 'border-success-500/60 bg-success-500/15',
  },
  warning: {
    bg: 'bg-warning-bg',
    text: 'text-warning-500',
    border: 'border-warning-500/20',
    activeBorder: 'border-warning-500/60 bg-warning-500/15',
  },
  danger: {
    bg: 'bg-danger-bg',
    text: 'text-danger-500',
    border: 'border-danger-500/20',
    activeBorder: 'border-danger-500/60 bg-danger-500/15',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    border: 'border-cyan-500/20',
    activeBorder: 'border-cyan-500/60 bg-cyan-500/20',
  },
};

/**
 * Mini-card stat compacte (utile pour stats inline ou filtre cliquable).
 */
export default function StatPill({
  icon: Icon,
  label,
  value,
  tone = 'brand',
  active = false,
  onClick,
}: Props) {
  const t = TONES[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        active
          ? t.activeBorder
          : `bg-bg-elevated/40 ${t.border} ${onClick ? 'hover:bg-bg-elevated/70' : ''}`
      } ${onClick ? 'cursor-pointer text-left w-full' : ''}`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-lg ${t.bg} ${t.text} flex items-center justify-center shrink-0`}>
          <Icon size={16} strokeWidth={2.25} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim truncate">
          {label}
        </div>
        <div className={`text-xl font-bold ${t.text}`}>{value}</div>
      </div>
    </Tag>
  );
}
