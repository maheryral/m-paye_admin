import { useEffect, useMemo, useState } from 'react';
import { AppWindow, Image as ImageIcon, Plus, Trash2, Pencil, X, ExternalLink } from 'lucide-react';
import {
  billersAdminApi,
  serviceTypesAdminApi,
  type Biller,
  type BillerIntegrationType,
  type ServiceType,
} from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import IconPicker, { getLucideIcon } from '../components/IconPicker';

/** Mode de représentation visuelle du biller dans l'app user. */
type VisualMode = 'ICON' | 'LOGO';

type FormState = {
  name: string;
  iconName: string;
  logoUrl: string;
  color: string;
  redirectPath: string;
  integrationType: BillerIntegrationType;
  isEssential: boolean;
  description: string;
  sortOrder: number;
  serviceTypeId: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  iconName: '',
  logoUrl: '',
  color: '',
  redirectPath: '',
  integrationType: 'WEB',
  isEssential: false,
  description: '',
  sortOrder: 0,
  serviceTypeId: '',
  isActive: true,
};

/**
 * Gestion des BILLERS (JIRAMA, Canal+, Madagascar Airlines…).
 * Chaque biller est un mini-program web vers lequel l'app user redirige.
 */
export default function Billers() {
  const [items, setItems] = useState<Biller[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Biller | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  // Mode visuel exclusif : soit une icône Lucide, soit un logo URL.
  const [visualMode, setVisualMode] = useState<VisualMode>('ICON');
  // Modal de sélection d'icône (grille curatée).
  const [showIconPicker, setShowIconPicker] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [list, tps] = await Promise.all([
        billersAdminApi.list(),
        serviceTypesAdminApi.list(),
      ]);
      setItems(list);
      setTypes(tps);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filterType) return items;
    return items.filter((b) => b.serviceTypeId === filterType);
  }, [items, filterType]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      serviceTypeId: types[0]?.id ?? '',
    });
    setVisualMode('ICON');
    setError(null);
    setShowForm(true);
  }

  function openEdit(b: Biller) {
    setEditing(b);
    setForm({
      name: b.name,
      iconName: b.iconName ?? '',
      logoUrl: b.logoUrl ?? '',
      color: b.color ?? '',
      redirectPath: b.redirectPath,
      integrationType: b.integrationType ?? 'WEB',
      isEssential: b.isEssential ?? false,
      description: b.description ?? '',
      sortOrder: b.sortOrder,
      serviceTypeId: b.serviceTypeId,
      isActive: b.isActive,
    });
    // Si logo URL renseigné en DB → mode LOGO, sinon mode ICON par défaut
    setVisualMode(b.logoUrl ? 'LOGO' : 'ICON');
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.serviceTypeId) {
      setError('Type de service requis');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        iconName: form.iconName.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        color: form.color.trim() || null,
        redirectPath: form.redirectPath.trim(),
        integrationType: form.integrationType,
        isEssential: form.isEssential,
        description: form.description.trim() || null,
        sortOrder: form.sortOrder,
        serviceTypeId: form.serviceTypeId,
        isActive: form.isActive,
      };
      if (editing) {
        await billersAdminApi.update(editing.id, payload);
      } else {
        await billersAdminApi.create(payload);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Échec de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(b: Biller) {
    await billersAdminApi.update(b.id, { isActive: !b.isActive });
    load();
  }

  async function remove(b: Biller) {
    if (!confirm(`Supprimer le biller "${b.name}" ?`)) return;
    try {
      await billersAdminApi.remove(b.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Suppression impossible');
    }
  }

  return (
    <div>
      <PageHeader
        title="Billers (mini-programs)"
        subtitle="JIRAMA, Canal+, voyages, restauration… Chaque biller redirige vers un mini-program web."
        icon={AppWindow}
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Nouveau biller
          </button>
        }
      />

      {/* Filtre par type */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-ink-muted">Filtrer :</label>
        <select
          className="input max-w-xs"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tous les types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-ink-muted">Chargement…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AppWindow}
          title="Aucun biller"
          description={
            filterType
              ? 'Aucun biller pour ce type.'
              : 'Crée un type de service puis ajoute des billers.'
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-elevated text-ink-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Biller</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">URL/Path</th>
                <th className="text-right px-4 py-3 font-semibold">Ordre</th>
                <th className="text-center px-4 py-3 font-semibold">Actif</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-bg-border hover:bg-bg-elevated/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.color && (
                        <span
                          className="inline-block w-6 h-6 rounded shrink-0"
                          style={{ background: b.color }}
                        />
                      )}
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          {b.name}
                          {b.isEssential && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-warning-bg text-warning-400 font-bold"
                              title="App essentielle — affichée dans Home Apps"
                            >
                              ⭐ ESSENTIEL
                            </span>
                          )}
                        </div>
                        {b.iconName && (
                          <div className="text-[11px] text-ink-dim">icon: {b.iconName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {b.serviceType && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          background: (b.serviceType.color || '#6366F1') + '22',
                          color: b.serviceType.color || '#6366F1',
                        }}
                      >
                        {b.serviceType.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.integrationType === 'NATIVE'
                            ? 'bg-warning-bg text-warning-400'
                            : 'bg-brand-500/15 text-brand-300'
                        }`}
                        title={
                          b.integrationType === 'NATIVE'
                            ? 'Écran natif (pas de WebView)'
                            : 'Mini-program web (WebView sur mobile)'
                        }
                      >
                        {b.integrationType === 'NATIVE' ? 'NATIVE' : 'WEB'}
                      </span>
                      <span className="text-ink-muted">{b.redirectPath}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{b.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(b)}
                      role="switch"
                      aria-checked={b.isActive}
                      title={b.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base ${
                        b.isActive
                          ? 'bg-success-500 focus:ring-success-500'
                          : 'bg-bg-elevated border border-bg-border focus:ring-ink-dim'
                      }`}
                    >
                      <span className="sr-only">
                        {b.isActive ? 'Activé' : 'Désactivé'}
                      </span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          b.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        b.isActive ? 'text-success-400' : 'text-ink-dim'
                      }`}
                    >
                      {b.isActive ? 'ON' : 'OFF'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        className="p-1.5 rounded hover:bg-bg-elevated"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(b)}
                        className="p-1.5 rounded hover:bg-danger-bg text-danger-400"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card max-w-xl w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editing ? 'Modifier le biller' : 'Nouveau biller'}
              </h2>
              <button onClick={() => setShowForm(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Nom affiché</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: JIRAMA"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Type de service</label>
                <select
                  className="input"
                  value={form.serviceTypeId}
                  onChange={(e) => setForm({ ...form, serviceTypeId: e.target.value })}
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
              {/* Mode visuel exclusif : icône OU logo */}
              <div>
                <label className="label">Représentation visuelle</label>
                <div className="flex gap-2 p-1 bg-bg-elevated rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setVisualMode('ICON');
                      setForm({ ...form, logoUrl: '' });
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition ${
                      visualMode === 'ICON'
                        ? 'bg-brand-500 text-white'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <AppWindow size={14} />
                    Icône
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVisualMode('LOGO');
                      setForm({ ...form, iconName: '' });
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition ${
                      visualMode === 'LOGO'
                        ? 'bg-brand-500 text-white'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <ImageIcon size={14} />
                    Logo (URL)
                  </button>
                </div>
              </div>

              {visualMode === 'ICON' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Icône</label>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(true)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-bg-border bg-bg-elevated hover:border-brand-500 transition"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: form.color || '#6366F1' }}
                      >
                        {(() => {
                          const Icon = getLucideIcon(form.iconName);
                          return Icon ? (
                            <Icon size={18} className="text-white" />
                          ) : (
                            <AppWindow size={18} className="text-white/60" />
                          );
                        })()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">
                          {form.iconName || 'Choisir une icône'}
                        </div>
                        <div className="text-[11px] text-ink-dim">
                          Cliquez pour parcourir
                        </div>
                      </div>
                    </button>
                  </div>
                  <div>
                    <label className="label">Couleur (hex)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-10 w-10 rounded border border-bg-border bg-bg-elevated cursor-pointer shrink-0"
                        value={form.color || '#6366F1'}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder="#F59E0B"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label">Logo URL</label>
                  <div className="flex gap-3">
                    {form.logoUrl && (
                      <img
                        src={form.logoUrl}
                        alt="Aperçu"
                        className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-bg-border shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <input
                      type="text"
                      className="input"
                      placeholder="https://…/jirama.png"
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    />
                  </div>
                  <p className="text-[11px] text-ink-dim mt-1">
                    URL absolue d'une image (PNG/SVG/JPG). Privilégiez un fond
                    transparent ou blanc.
                  </p>
                </div>
              )}
              <div>
                <label className="label">Type d'intégration</label>
                <select
                  className="input"
                  value={form.integrationType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      integrationType: e.target.value as BillerIntegrationType,
                    })
                  }
                >
                  <option value="WEB">
                    Mini-program web (WebView mobile)
                  </option>
                  <option value="NATIVE">
                    Écran natif mobile (taxi-brousse, téléphérique…)
                  </option>
                </select>
                <p className="text-[11px] text-ink-dim mt-1">
                  WEB = ouvre une URL/route web en WebView sur mobile. NATIVE =
                  navigue vers un écran React Native existant (pas de WebView).
                </p>
              </div>
              <div>
                <label className="label">
                  {form.integrationType === 'NATIVE'
                    ? 'Route native (expo-router)'
                    : 'Path du mini-program'}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={
                    form.integrationType === 'NATIVE'
                      ? '/taxi-brousse'
                      : '/apps/hotels'
                  }
                  value={form.redirectPath}
                  onChange={(e) => setForm({ ...form, redirectPath: e.target.value })}
                  required
                />
                <p className="text-[11px] text-ink-dim mt-1">
                  {form.integrationType === 'NATIVE' ? (
                    <>
                      Nom de la route expo-router (ex: <code>/taxi-brousse</code>,{' '}
                      <code>/telepherique</code>). L'écran doit déjà exister dans l'app.
                    </>
                  ) : (
                    <>
                      Chemin interne du mini-program (ex: <code>/apps/hotels</code>).
                      Le mobile l'ouvrira en WebView avec le token d'auth.
                    </>
                  )}
                </p>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ordre d'affichage</label>
                  <input
                    type="number"
                    className="input"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <span className="text-sm">Actif</span>
                  </label>
                  <label
                    className="flex items-center gap-2"
                    title="Apparaît dans la catégorie virtuelle 'Home Apps' du dashboard"
                  >
                    <input
                      type="checkbox"
                      checked={form.isEssential}
                      onChange={(e) => setForm({ ...form, isEssential: e.target.checked })}
                    />
                    <span className="text-sm">⭐ Essentiel</span>
                  </label>
                </div>
              </div>
              {error && (
                <div className="p-2 rounded bg-danger-bg text-danger-400 text-xs">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '…' : editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Picker d'icônes — rendu sur layer z-60 (au-dessus du form modal) */}
      {showIconPicker && (
        <IconPicker
          value={form.iconName || null}
          color={form.color}
          onChange={(name) => setForm({ ...form, iconName: name })}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}
