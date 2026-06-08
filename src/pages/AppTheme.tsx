// src/pages/AppTheme.tsx
// Édition du thème global (couleurs light + dark) partagé mobile + web.
// Preview live à droite : mini wireframe d'une app M'Paye qui utilise les couleurs.

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Loader2,
  Moon,
  Palette,
  RotateCw,
  Sun,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import {
  appThemeAdminApi,
  THEME_COLOR_KEYS,
  type ThemeColorKey,
  type ThemeColors,
} from '../services/superAdminApi';

// ─── Métadonnées des clés (label FR + description) ──────────────────────

const KEY_META: Record<ThemeColorKey, { label: string; hint: string }> = {
  primary: { label: 'Primaire', hint: 'Couleur principale, CTA, headers' },
  primaryDark: { label: 'Primaire foncé', hint: 'Hover / accent header' },
  secondary: { label: 'Secondaire', hint: 'Couleur d\'accentuation (violet par défaut)' },
  background: { label: 'Fond app', hint: 'Background général de l\'écran' },
  card: { label: 'Cartes', hint: 'Fond des cartes et surfaces élevées' },
  text: { label: 'Texte principal', hint: 'Titres, paragraphes principaux' },
  textSecondary: { label: 'Texte secondaire', hint: 'Sous-titres, labels' },
  textTertiary: { label: 'Texte tertiaire', hint: 'Placeholders, infos faibles' },
  border: { label: 'Bordure', hint: 'Bordures des cartes et inputs' },
  borderLight: { label: 'Bordure claire', hint: 'Séparateurs subtils' },
  error: { label: 'Erreur', hint: 'Rouge danger, refus' },
  success: { label: 'Succès', hint: 'Validation paiement, confirmation' },
  warning: { label: 'Avertissement', hint: 'Solde bas, à payer' },
  info: { label: 'Information', hint: 'Tips, badges neutres' },
  overlay: { label: 'Overlay modal', hint: 'Fond derrière les bottom sheets (rgba)' },
  shadow: { label: 'Ombre', hint: 'Base des ombres portées' },
};

// ─── Composant principal ─────────────────────────────────────────────────

export default function AppThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // États : copies locales modifiables (initialisées au load)
  const [light, setLight] = useState<ThemeColors | null>(null);
  const [dark, setDark] = useState<ThemeColors | null>(null);
  const [original, setOriginal] = useState<{ light: ThemeColors; dark: ThemeColors } | null>(null);

  // Aperçu : light / dark
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const t = await appThemeAdminApi.get();
      setLight(t.colorsLight);
      setDark(t.colorsDark);
      setOriginal({ light: t.colorsLight, dark: t.colorsDark });
      setVersion(t.version);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Chargement échoué');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const isDirty = useMemo(() => {
    if (!original || !light || !dark) return false;
    return (
      JSON.stringify(light) !== JSON.stringify(original.light) ||
      JSON.stringify(dark) !== JSON.stringify(original.dark)
    );
  }, [original, light, dark]);

  const handleSave = async () => {
    if (!light || !dark || !isDirty) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const t = await appThemeAdminApi.update({ colorsLight: light, colorsDark: dark });
      setOriginal({ light: t.colorsLight, dark: t.colorsDark });
      setVersion(t.version);
      setSuccess(`Thème enregistré (v${t.version}). Les apps verront les nouvelles couleurs à leur prochain lancement.`);
      setTimeout(() => setSuccess(null), 6000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Sauvegarde échouée');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!original) return;
    if (!confirm('Annuler les modifications non sauvegardées ?')) return;
    setLight(original.light);
    setDark(original.dark);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    );
  }
  if (!light || !dark) {
    return (
      <div className="p-6 text-center text-danger-400">
        Impossible de charger le thème. {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Thème global"
        subtitle={`Couleurs partagées mobile + web · v${version}`}
        icon={Palette}
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-sm text-ink-dim hover:bg-bg-elevated px-3 py-2 rounded-lg"
              >
                <RotateCw size={14} />
                Annuler les modifs
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 disabled:bg-bg-elevated disabled:text-ink-dim text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Enregistrer
            </button>
          </div>
        }
      />

      {/* Toasts */}
      {error && (
        <div className="bg-danger-bg/30 border border-danger-400/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-danger-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-success-400/15 border border-success-400/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Check size={16} className="text-success-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success-400">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne édition — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <ThemeEditor
            title="Mode clair"
            icon={<Sun size={16} />}
            colors={light}
            onChange={setLight}
            isActive={previewMode === 'light'}
            onFocus={() => setPreviewMode('light')}
          />
          <ThemeEditor
            title="Mode sombre"
            icon={<Moon size={16} />}
            colors={dark}
            onChange={setDark}
            isActive={previewMode === 'dark'}
            onFocus={() => setPreviewMode('dark')}
          />
        </div>

        {/* Preview — 1/3 sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-bg-surface border border-bg-elevated rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-bg-elevated flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Aperçu</p>
                <div className="flex gap-1 bg-bg-elevated rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode('light')}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      previewMode === 'light' ? 'bg-bg-surface text-ink' : 'text-ink-dim'
                    }`}
                  >
                    <Sun size={12} />
                    Light
                  </button>
                  <button
                    onClick={() => setPreviewMode('dark')}
                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      previewMode === 'dark' ? 'bg-bg-surface text-ink' : 'text-ink-dim'
                    }`}
                  >
                    <Moon size={12} />
                    Dark
                  </button>
                </div>
              </div>
              <ThemePreview colors={previewMode === 'light' ? light : dark} />
            </div>

            <p className="text-xs text-ink-dim mt-3 text-center">
              💡 Les changements seront visibles dans les apps au prochain cold-start
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Editor (un par mode light/dark) ────────────────────────────────────

function ThemeEditor({
  title, icon, colors, onChange, isActive, onFocus,
}: {
  title: string;
  icon: React.ReactNode;
  colors: ThemeColors;
  onChange: (c: ThemeColors) => void;
  isActive: boolean;
  onFocus: () => void;
}) {
  return (
    <div
      onClick={onFocus}
      className={`bg-bg-surface border rounded-2xl overflow-hidden transition-colors ${
        isActive ? 'border-primary-500/50' : 'border-bg-elevated'
      }`}
    >
      <div className="px-5 py-3 border-b border-bg-elevated flex items-center gap-2">
        {icon}
        <p className="font-semibold text-ink text-sm">{title}</p>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEME_COLOR_KEYS.map((key) => (
          <ColorRow
            key={key}
            colorKey={key}
            value={colors[key]}
            onChange={(v) => onChange({ ...colors, [key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Ligne d'édition d'une couleur ──────────────────────────────────────

function ColorRow({
  colorKey, value, onChange,
}: {
  colorKey: ThemeColorKey;
  value: string;
  onChange: (v: string) => void;
}) {
  const meta = KEY_META[colorKey];
  const isHexColor = /^#[0-9a-f]{3,8}$/i.test(value.trim());

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-elevated/40">
      {/* Swatch + native picker (uniquement si hex) */}
      <label
        className="relative w-10 h-10 rounded-lg border border-bg-border flex-shrink-0 overflow-hidden cursor-pointer"
        style={{
          background: value,
          // damier pour mettre en évidence si la couleur a un alpha
          backgroundImage:
            value.includes('rgba')
              ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%), ${value}`
              : undefined,
          backgroundSize: value.includes('rgba') ? '8px 8px' : undefined,
          backgroundPosition: value.includes('rgba') ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
        }}
      >
        {isHexColor && (
          <input
            type="color"
            value={value.length === 7 ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label={`Picker pour ${meta.label}`}
          />
        )}
      </label>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium text-ink">{meta.label}</span>
          <code className="text-[10px] text-ink-dim">{colorKey}</code>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full mt-1 bg-transparent text-xs font-mono text-ink-dim focus:text-ink outline-none border-b border-transparent focus:border-primary-500"
        />
      </div>
    </div>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────

function ThemePreview({ colors }: { colors: ThemeColors }) {
  return (
    <div style={{ background: colors.background }} className="p-4">
      <div
        style={{ background: colors.card, borderColor: colors.border, color: colors.text }}
        className="rounded-2xl border p-4 shadow"
      >
        {/* Hero solde */}
        <div
          style={{ background: colors.primary, color: '#fff' }}
          className="rounded-xl p-4 mb-4"
        >
          <p className="text-xs opacity-80">Solde disponible</p>
          <p className="text-2xl font-bold mt-1">850 000 Ar</p>
          <div className="flex gap-2 mt-3">
            <button
              style={{ background: 'rgba(255,255,255,0.2)' }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              + Recevoir
            </button>
            <button
              style={{ background: 'rgba(255,255,255,0.2)' }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              Envoyer
            </button>
          </div>
        </div>

        {/* Liste mini */}
        <p style={{ color: colors.textSecondary }} className="text-xs mb-2 font-medium uppercase tracking-wider">
          Activité
        </p>
        <div className="space-y-1.5">
          {[
            { icon: '+', label: 'De Rakoto', amount: '+5 000 Ar', color: colors.success },
            { icon: '−', label: 'Carlton', amount: '-25 000 Ar', color: colors.error },
            { icon: '⏱', label: 'En attente', amount: '-12 000 Ar', color: colors.warning },
          ].map((tx, i) => (
            <div
              key={i}
              style={{ borderColor: colors.borderLight }}
              className="flex items-center gap-2.5 py-2 border-t first:border-t-0"
            >
              <div
                style={{ background: tx.color, color: '#fff' }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              >
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: colors.text }}>{tx.label}</p>
                <p className="text-[10px]" style={{ color: colors.textTertiary }}>il y a 2h</p>
              </div>
              <p className="text-xs font-bold" style={{ color: tx.color }}>{tx.amount}</p>
            </div>
          ))}
        </div>

        {/* Badge info */}
        <div
          style={{ background: `${colors.info}20`, borderColor: colors.info, color: colors.info }}
          className="mt-4 rounded-lg p-2.5 border text-xs flex items-center gap-2"
        >
          <span style={{ background: colors.info, color: '#fff' }} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">i</span>
          KYC en attente de validation
        </div>

        {/* CTA secondaire */}
        <button
          style={{ background: colors.secondary, color: '#fff' }}
          className="w-full mt-3 py-2.5 rounded-lg text-xs font-bold"
        >
          Passer Premium
        </button>
      </div>
    </div>
  );
}
