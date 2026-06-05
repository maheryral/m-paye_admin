// src/components/IconPicker.tsx
// Sélecteur visuel d'icônes lucide-react pour les billers et types de service.
// Liste curatée des icônes pertinentes pour des services payants (utilities,
// transport, divertissement, finance, restauration, etc.). L'admin peut aussi
// rechercher par nom pour filtrer.

import { useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { type LucideIcon, Search, X } from 'lucide-react';

/**
 * Liste curatée — icônes représentatives pour les billers M'Paye.
 * Pour ajouter une icône, mets juste son nom lucide-react ici.
 */
export const CURATED_ICONS = [
  // Utilities (factures)
  'Zap', 'Droplets', 'Wifi', 'Tv', 'Smartphone', 'Phone', 'FileText',
  'Receipt', 'Lightbulb', 'Flame', 'Plug',
  // Transport / voyage
  'Plane', 'Car', 'Bus', 'Train', 'Ship', 'Bike', 'CableCar', 'Truck',
  'MapPin', 'Map', 'Navigation', 'Compass', 'Hotel',
  // Restauration
  'UtensilsCrossed', 'Pizza', 'Coffee', 'Beer', 'Wine', 'CakeSlice',
  'IceCream', 'ChefHat', 'Apple',
  // Finance / banque
  'Wallet', 'CreditCard', 'Banknote', 'Coins', 'Landmark', 'Building2',
  'PiggyBank', 'TrendingUp', 'DollarSign', 'Euro',
  // Shopping
  'ShoppingCart', 'ShoppingBag', 'Store', 'Package', 'Tag', 'Gift',
  'Ticket', 'BadgePercent',
  // Loisirs / divertissement
  'Film', 'Music', 'Gamepad2', 'Headphones', 'Camera', 'Mic',
  'PartyPopper', 'Sparkles', 'Trophy', 'Heart', 'Star',
  // Santé
  'Stethoscope', 'Pill', 'Activity', 'HeartPulse', 'Cross',
  // Éducation
  'BookOpen', 'GraduationCap', 'School', 'Library', 'Pencil',
  // Divers
  'Home', 'Briefcase', 'Calendar', 'Clock', 'Users', 'User',
  'MessageCircle', 'Mail', 'Globe', 'Cloud', 'Shield', 'Lock',
  'Settings', 'AppWindow', 'LayoutGrid',
] as const;

export type CuratedIconName = (typeof CURATED_ICONS)[number];

/** Récupère un composant Lucide depuis son nom string. */
export function getLucideIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  const Comp = (Icons as any)[name];
  return Comp || null;
}

/**
 * Modal popup pour sélectionner une icône.
 * Usage : <IconPicker value={iconName} onChange={setIconName} onClose={...} />
 */
export default function IconPicker({
  value,
  onChange,
  onClose,
  color,
}: {
  value: string | null;
  onChange: (iconName: string) => void;
  onClose: () => void;
  color?: string | null;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURATED_ICONS;
    return CURATED_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-bg-border">
          <h3 className="text-base font-bold">Choisir une icône</h3>
          <button onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-bg-border">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              type="text"
              autoFocus
              placeholder="Rechercher une icône (zap, plane, car…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9"
            />
          </div>
          <p className="text-[11px] text-ink-dim mt-2">
            {filtered.length} icône{filtered.length > 1 ? 's' : ''} disponible
            {filtered.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-ink-muted py-8">
              Aucune icône correspondante. Essayez "zap", "car", "tv"…
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {filtered.map((name) => {
                const Icon = getLucideIcon(name);
                if (!Icon) return null;
                const selected = value === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      onClose();
                    }}
                    title={name}
                    className={`group flex flex-col items-center gap-1 p-2 rounded-lg border transition ${
                      selected
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-transparent hover:border-bg-border hover:bg-bg-elevated'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: selected ? color || '#6366F1' : 'transparent',
                      }}
                    >
                      <Icon
                        size={18}
                        className={selected ? 'text-white' : 'text-ink'}
                      />
                    </div>
                    <span className="text-[9px] text-ink-dim group-hover:text-ink truncate w-full text-center">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
