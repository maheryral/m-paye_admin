import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  /** Boutons d'action à droite */
  actions?: ReactNode;
}

/**
 * En-tête de page standardisé.
 * - Titre dégradé subtle (ink → ink-muted)
 * - Icône optionnelle dans un cadre arrondi
 * - Slot actions à droite
 */
export default function PageHeader({ icon: Icon, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-2xl bg-gradient-brand-soft border border-brand-500/20 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-brand-300" strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-ink to-ink-muted bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
