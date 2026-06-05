import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Pencil, X } from 'lucide-react';
import {
  serviceTypesAdminApi,
  type ServiceType,
} from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

type FormState = {
  code: string;
  label: string;
  iconName: string;
  color: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  code: '',
  label: '',
  iconName: '',
  color: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

/**
 * Gestion des TYPES de service (catégories : Factures, Voyage, Restauration…).
 * Sert à grouper les billers dans la page Services de l'app user.
 */
export default function ServiceTypes() {
  const [items, setItems] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await serviceTypesAdminApi.list();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(st: ServiceType) {
    setEditing(st);
    setForm({
      code: st.code,
      label: st.label,
      iconName: st.iconName ?? '',
      color: st.color ?? '',
      description: st.description ?? '',
      sortOrder: st.sortOrder,
      isActive: st.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        iconName: form.iconName.trim() || null,
        color: form.color.trim() || null,
        description: form.description.trim() || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (editing) {
        await serviceTypesAdminApi.update(editing.id, payload);
      } else {
        await serviceTypesAdminApi.create(payload);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Échec de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(st: ServiceType) {
    await serviceTypesAdminApi.update(st.id, { isActive: !st.isActive });
    load();
  }

  async function remove(st: ServiceType) {
    if (!confirm(`Supprimer le type "${st.label}" ? Bloqué si des billers y sont rattachés.`)) {
      return;
    }
    try {
      await serviceTypesAdminApi.remove(st.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Suppression impossible');
    }
  }

  return (
    <div>
      <PageHeader
        title="Types de service"
        subtitle="Catégories utilisées pour grouper les billers (Factures, Voyage, …)"
        icon={Tag}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
          >
            <Plus size={16} />
            Nouveau type
          </button>
        }
      />

      {loading ? (
        <div className="p-8 text-center text-ink-muted">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aucun type de service"
          description="Crée le premier type pour pouvoir y rattacher des billers."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-elevated text-ink-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Libellé</th>
                <th className="text-left px-4 py-3 font-semibold">Icône</th>
                <th className="text-left px-4 py-3 font-semibold">Couleur</th>
                <th className="text-right px-4 py-3 font-semibold">Ordre</th>
                <th className="text-center px-4 py-3 font-semibold">Actif</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((st) => (
                <tr key={st.id} className="border-t border-bg-border hover:bg-bg-elevated/50">
                  <td className="px-4 py-3 font-mono text-xs">{st.code}</td>
                  <td className="px-4 py-3 font-semibold">{st.label}</td>
                  <td className="px-4 py-3 text-ink-muted">{st.iconName || '—'}</td>
                  <td className="px-4 py-3">
                    {st.color ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded"
                          style={{ background: st.color }}
                        />
                        <span className="font-mono text-xs">{st.color}</span>
                      </div>
                    ) : (
                      <span className="text-ink-dim">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{st.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(st)}
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        st.isActive
                          ? 'bg-success-bg text-success-400'
                          : 'bg-bg-elevated text-ink-muted'
                      }`}
                    >
                      {st.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(st)}
                        className="p-1.5 rounded hover:bg-bg-elevated"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(st)}
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
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editing ? 'Modifier le type' : 'Nouveau type'}
              </h2>
              <button onClick={() => setShowForm(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Code (slug)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: BILLS"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  disabled={!!editing}
                  pattern="[A-Z_]+"
                  title="Lettres majuscules et underscores uniquement"
                />
                {editing && (
                  <p className="text-[11px] text-ink-dim mt-1">
                    Le code ne se modifie pas après création.
                  </p>
                )}
              </div>
              <div>
                <label className="label">Libellé affiché</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Factures"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Icône (lucide)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="FileText"
                    value={form.iconName}
                    onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Couleur (hex)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="#3B82F6"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                </div>
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
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <span className="text-sm">Actif</span>
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
    </div>
  );
}
