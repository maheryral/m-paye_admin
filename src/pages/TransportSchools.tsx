// src/pages/TransportSchools.tsx — admin CRUD écoles + entry point

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  ChevronRight,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import {
  transportScolaireAdminApi,
  type AdminSchool,
  type UpsertSchoolDto,
} from '../services/superAdminApi';

const EMPTY_FORM: UpsertSchoolDto = {
  nom: '',
  ville: '',
  adresse: '',
  telephone: '',
  email: '',
  logoUrl: '',
  description: '',
  latitude: null,
  longitude: null,
  isActive: true,
};

export default function TransportSchools() {
  const [items, setItems] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminSchool | 'new' | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await transportScolaireAdminApi.listSchools());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (s: AdminSchool) => {
    if (!confirm(`Supprimer "${s.nom}" ? (refusé si l'école a des routes)`)) return;
    try {
      await transportScolaireAdminApi.removeSchool(s.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Suppression impossible');
    }
  };

  const handleToggle = async (s: AdminSchool) => {
    try {
      await transportScolaireAdminApi.updateSchool(s.id, { isActive: !s.isActive });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Transport scolaire — Écoles"
        subtitle="Gérer les écoles desservies par le service de bus scolaire"
        icon={GraduationCap}
        actions={
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} />
            Nouvelle école
          </button>
        }
      />

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aucune école"
          description="Créez une école pour commencer."
        />
      ) : (
        <div className="bg-bg-surface border border-bg-elevated rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-dim uppercase border-b border-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left">École</th>
                <th className="px-4 py-3 text-left">Ville</th>
                <th className="px-4 py-3 text-center">Routes</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-bg-elevated/60 hover:bg-bg-elevated/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <GraduationCap size={16} className="text-primary-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-ink">{s.nom}</p>
                        {s.adresse && (
                          <p className="text-xs text-ink-dim flex items-center gap-1">
                            <MapPin size={11} />
                            {s.adresse}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{s.ville}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/transport-scolaire/schools/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-medium"
                    >
                      <Bus size={12} />
                      {s._count?.routes ?? 0}
                      <ChevronRight size={12} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        s.isActive
                          ? 'bg-success-400/20 text-success-400'
                          : 'bg-ink-faint/10 text-ink-dim'
                      }`}
                    >
                      {s.isActive ? 'ACTIF' : 'INACTIF'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleToggle(s)}
                        className="p-1.5 rounded hover:bg-bg-elevated"
                        title={s.isActive ? 'Désactiver' : 'Activer'}
                      >
                        <Power size={14} className={s.isActive ? 'text-success-400' : 'text-ink-dim'} />
                      </button>
                      <button
                        onClick={() => setEditing(s)}
                        className="p-1.5 rounded hover:bg-bg-elevated"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
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

      {editing && (
        <SchoolFormDialog
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function SchoolFormDialog({
  existing, onClose, onSaved,
}: {
  existing: AdminSchool | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpsertSchoolDto>(
    existing
      ? {
          nom: existing.nom,
          ville: existing.ville,
          adresse: existing.adresse ?? '',
          telephone: existing.telephone ?? '',
          email: existing.email ?? '',
          logoUrl: existing.logoUrl ?? '',
          description: existing.description ?? '',
          latitude: existing.latitude,
          longitude: existing.longitude,
          isActive: existing.isActive,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await transportScolaireAdminApi.updateSchool(existing.id, form);
      } else {
        await transportScolaireAdminApi.createSchool(form);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Échec');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="bg-bg-surface border border-bg-elevated rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-lg">
            {existing ? 'Modifier l\'école' : 'Nouvelle école'}
          </h3>
          <button type="button" onClick={onClose} className="text-ink-dim hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>

        <Row>
          <Field label="Nom *" value={form.nom ?? ''} onChange={(v) => setForm({ ...form, nom: v })} />
          <Field label="Ville *" value={form.ville ?? ''} onChange={(v) => setForm({ ...form, ville: v })} />
        </Row>
        <Field label="Adresse" value={form.adresse ?? ''} onChange={(v) => setForm({ ...form, adresse: v })} multiline />
        <Row>
          <Field label="Téléphone" value={form.telephone ?? ''} onChange={(v) => setForm({ ...form, telephone: v })} />
          <Field label="Email" value={form.email ?? ''} onChange={(v) => setForm({ ...form, email: v })} />
        </Row>
        <Field label="Logo URL" value={form.logoUrl ?? ''} onChange={(v) => setForm({ ...form, logoUrl: v })} placeholder="https://..." />
        <Field label="Description" value={form.description ?? ''} onChange={(v) => setForm({ ...form, description: v })} multiline />
        <Row>
          <Field
            label="Latitude"
            value={form.latitude?.toString() ?? ''}
            onChange={(v) => setForm({ ...form, latitude: v ? Number(v) : null })}
            inputMode="numeric"
          />
          <Field
            label="Longitude"
            value={form.longitude?.toString() ?? ''}
            onChange={(v) => setForm({ ...form, longitude: v ? Number(v) : null })}
            inputMode="numeric"
          />
        </Row>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={!!form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          École active (visible côté parent)
        </label>

        {error && (
          <div className="bg-danger-bg/30 border border-danger-400/30 rounded p-2 text-xs text-danger-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-ink-dim hover:bg-bg-elevated rounded">
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 disabled:bg-bg-elevated text-white rounded flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label, value, onChange, placeholder, multiline, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: 'text' | 'numeric';
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-dim">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink"
        />
      ) : (
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink"
        />
      )}
    </label>
  );
}
