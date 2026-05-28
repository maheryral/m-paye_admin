interface Tab {
  value: string;
  label: string;
  count?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}

interface Props {
  tabs: Tab[];
  value: string;
  onChange: (v: string) => void;
}

const TONES = {
  brand: 'data-[active=true]:bg-brand-500/15 data-[active=true]:text-brand-300 data-[active=true]:border-brand-500/40',
  success: 'data-[active=true]:bg-success-bg data-[active=true]:text-success-500 data-[active=true]:border-success-500/40',
  warning: 'data-[active=true]:bg-warning-bg data-[active=true]:text-warning-500 data-[active=true]:border-warning-500/40',
  danger: 'data-[active=true]:bg-danger-bg data-[active=true]:text-danger-500 data-[active=true]:border-danger-500/40',
};

/**
 * Boutons-pills pour filtrer (ex: PENDING / APPROVED / REJECTED).
 * Indique le compteur en badge si fourni.
 */
export default function FilterTabs({ tabs, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tabs.map((t) => {
        const isActive = t.value === value;
        const tone = TONES[t.tone ?? 'brand'];
        return (
          <button
            key={t.value}
            data-active={isActive}
            onClick={() => onChange(t.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-bg-border bg-bg-elevated/40 text-ink-muted hover:text-ink hover:bg-bg-elevated/70 transition-all ${tone}`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`inline-block min-w-[18px] px-1 text-center rounded-full text-[9px] font-bold ${
                  isActive ? 'bg-white/20' : 'bg-bg-border'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
