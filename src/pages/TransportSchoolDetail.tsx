// src/pages/TransportSchoolDetail.tsx
// Détail d'une école + CRUD des routes qui la desservent.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Power,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import {
  transportScolaireAdminApi,
  type AdminRoute,
  type AdminSchool,
  type UpsertRouteDto,
} from '../services/superAdminApi';

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DAY_LABEL: Record<string, string> = {
  MON: 'Lun', TUE: 'Mar', WED: 'Mer', THU: 'Jeu', FRI: 'Ven', SAT: 'Sam', SUN: 'Dim',
};

export default function TransportSchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<AdminSchool | null>(null);
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminRoute | 'new' | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        transportScolaireAdminApi.getSchool(id),
        transportScolaireAdminApi.listRoutes(id),
      ]);
      setSchool(s);
      setRoutes(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const handleDelete = async (r: AdminRoute) => {
    if (!confirm(`Supprimer "${r.nom}" ? (refusé si abonnements actifs)`)) return;
    try {
      await transportScolaireAdminApi.removeRoute(r.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur');
    }
  };

  const handleToggle = async (r: AdminRoute) => {
    try {
      await transportScolaireAdminApi.updateRoute(r.id, { isActive: !r.isActive });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link
        to="/transport-scolaire/schools"
        className="inline-flex items-center gap-1 text-sm text-ink-dim hover:text-ink mb-4"
      >
        <ArrowLeft size={14} />
        Retour aux écoles
      </Link>

      <PageHeader
        title={school?.nom ?? '...'}
        subtitle={school ? `${school.ville} · ${routes.length} route(s)` : ''}
        icon={Bus}
        actions={
          <button
            onClick={() => setEditing('new')}
            disabled={!id}
            className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} />
            Nouvelle route
          </button>
        }
      />

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      ) : routes.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="Aucune route"
          description="Créez une route pour cette école."
        />
      ) : (
        <div className="space-y-3">
          {routes.map((r) => (
            <div
              key={r.id}
              className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Bus size={18} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/transport-scolaire/routes/${r.id}`}
                  className="font-semibold text-ink hover:text-primary-300"
                >
                  {r.nom}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-ink-dim">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {r.heureDepartMatin ?? '—'} → {r.heureRetourSoir ?? '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {r._count?.subscriptions ?? 0}/{r.capaciteMax}
                  </span>
                  <span>·</span>
                  <span>{r._count?.pricingPlans ?? 0} plan(s)</span>
                  <span>·</span>
                  <span>{r._count?.stops ?? 0} arrêt(s)</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {(r.joursDesservis ?? []).map((d) => (
                    <span
                      key={d}
                      className="text-[10px] bg-bg-elevated text-ink-dim px-1.5 py-0.5 rounded"
                    >
                      {DAY_LABEL[d] ?? d}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  r.isActive
                    ? 'bg-success-400/20 text-success-400'
                    : 'bg-ink-faint/10 text-ink-dim'
                }`}
              >
                {r.isActive ? 'ACTIF' : 'INACTIF'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleToggle(r)} className="p-1.5 rounded hover:bg-bg-elevated" title={r.isActive ? 'Désactiver' : 'Activer'}>
                  <Power size={14} className={r.isActive ? 'text-success-400' : 'text-ink-dim'} />
                </button>
                <button onClick={() => setEditing(r)} className="p-1.5 rounded hover:bg-bg-elevated" title="Modifier">
                  <Pencil size={14} />
                </button>
                <Link to={`/transport-scolaire/routes/${r.id}`} className="p-1.5 rounded hover:bg-bg-elevated">
                  <ChevronRight size={14} />
                </Link>
                <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:bg-danger-bg text-danger-400" title="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && id && (
        <RouteFormDialog
          schoolId={id}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}
    </div>
  );
}

function RouteFormDialog({
  schoolId, existing, onClose, onSaved,
}: {
  schoolId: string;
  existing: AdminRoute | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpsertRouteDto>(
    existing
      ? {
          nom: existing.nom,
          description: existing.description ?? '',
          voitureId: existing.voitureId ?? '',
          chauffeurId: existing.chauffeurId ?? '',
          capaciteMax: existing.capaciteMax,
          heureDepartMatin: existing.heureDepartMatin ?? '',
          heureRetourSoir: existing.heureRetourSoir ?? '',
          joursDesservis: existing.joursDesservis ?? ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          isActive: existing.isActive,
        }
      : {
          nom: '',
          description: '',
          voitureId: '',
          chauffeurId: '',
          capaciteMax: 20,
          heureDepartMatin: '06:30',
          heureRetourSoir: '16:30',
          joursDesservis: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          isActive: true,
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (d: string) => {
    const set = new Set(form.joursDesservis ?? []);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    setForm({ ...form, joursDesservis: ALL_DAYS.filter((day) => set.has(day)) as any });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const dto: UpsertRouteDto = {
        ...form,
        schoolId: existing ? undefined : schoolId,
        voitureId: form.voitureId?.trim() || null,
        chauffeurId: form.chauffeurId?.trim() || null,
        heureDepartMatin: form.heureDepartMatin?.trim() || null,
        heureRetourSoir: form.heureRetourSoir?.trim() || null,
      };
      if (existing) await transportScolaireAdminApi.updateRoute(existing.id, dto);
      else await transportScolaireAdminApi.createRoute(dto);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        className="bg-bg-surface border border-bg-elevated rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-lg">
            {existing ? 'Modifier la route' : 'Nouvelle route'}
          </h3>
          <button type="button" onClick={onClose} className="text-ink-dim hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>

        <FormField label="Nom *" value={form.nom ?? ''} onChange={(v) => setForm({ ...form, nom: v })} placeholder="Ligne A — Anosibe" />
        <FormField label="Description" value={form.description ?? ''} onChange={(v) => setForm({ ...form, description: v })} multiline />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Capacité max *" type="number" value={String(form.capaciteMax ?? 20)} onChange={(v) => setForm({ ...form, capaciteMax: Number(v) || 20 })} />
          <div /> {/* spacer */}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Heure départ matin" value={form.heureDepartMatin ?? ''} onChange={(v) => setForm({ ...form, heureDepartMatin: v })} placeholder="06:30" />
          <FormField label="Heure retour soir" value={form.heureRetourSoir ?? ''} onChange={(v) => setForm({ ...form, heureRetourSoir: v })} placeholder="16:30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Voiture (ID)" value={form.voitureId ?? ''} onChange={(v) => setForm({ ...form, voitureId: v })} placeholder="cuid (optionnel)" />
          <FormField label="Chauffeur (ID)" value={form.chauffeurId ?? ''} onChange={(v) => setForm({ ...form, chauffeurId: v })} placeholder="cuid (optionnel)" />
        </div>

        <div>
          <p className="text-xs text-ink-dim mb-2">Jours desservis</p>
          <div className="flex gap-1.5">
            {ALL_DAYS.map((d) => {
              const active = form.joursDesservis?.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                    active
                      ? 'bg-primary-500 text-white'
                      : 'bg-bg-elevated text-ink-dim hover:bg-bg-elevated/80'
                  }`}
                >
                  {DAY_LABEL[d]}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={!!form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Route active
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

function FormField({
  label, value, onChange, placeholder, multiline, type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
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
          type={type ?? 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink"
        />
      )}
    </label>
  );
}
