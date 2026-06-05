// src/pages/TransportRouteDetail.tsx
// Détail d'une route : 2 onglets (plans tarifaires + arrêts), CRUD nested.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import {
  transportScolaireAdminApi,
  type AdminPricingPlan,
  type AdminRoute,
  type AdminStop,
  type PlanCategory,
  type UpsertPricingPlanDto,
  type UpsertStopDto,
} from '../services/superAdminApi';

type Tab = 'plans' | 'stops';

export default function TransportRouteDetail() {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<(AdminRoute & { stops: AdminStop[]; pricingPlans: AdminPricingPlan[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('plans');

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const r = await transportScolaireAdminApi.getRoute(id);
      setRoute(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    );
  }
  if (!route) {
    return (
      <div className="p-6 text-center text-ink-dim">Route introuvable</div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        to={`/transport-scolaire/schools/${route.schoolId}`}
        className="inline-flex items-center gap-1 text-sm text-ink-dim hover:text-ink mb-4"
      >
        <ArrowLeft size={14} />
        Retour à l'école
      </Link>

      <PageHeader
        title={route.nom}
        subtitle={route.school?.nom ? `${route.school.nom} · ${route.school.ville}` : ''}
        icon={Bus}
      />

      <div className="flex gap-1 border-b border-bg-elevated mb-4">
        {(['plans', 'stops'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary-500 text-ink'
                : 'border-transparent text-ink-dim hover:text-ink'
            }`}
          >
            {t === 'plans'
              ? `Plans tarifaires (${route.pricingPlans.length})`
              : `Arrêts (${route.stops.length})`}
          </button>
        ))}
      </div>

      {tab === 'plans' ? (
        <PlansTab routeId={route.id} plans={route.pricingPlans} reload={load} />
      ) : (
        <StopsTab routeId={route.id} stops={route.stops} reload={load} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  PLANS
// ═══════════════════════════════════════════════════════

function PlansTab({
  routeId, plans, reload,
}: {
  routeId: string;
  plans: AdminPricingPlan[];
  reload: () => void;
}) {
  const [editing, setEditing] = useState<AdminPricingPlan | 'new' | null>(null);

  const handleDelete = async (p: AdminPricingPlan) => {
    if (!confirm(`Supprimer "${p.label}" ? (refusé si abonnements actifs)`)) return;
    try {
      await transportScolaireAdminApi.removePlan(routeId, p.id);
      reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} />
          Nouveau plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-bg-surface border border-bg-elevated rounded-2xl p-8 text-center text-ink-dim">
          <Tag size={32} className="mx-auto mb-3" />
          <p>Aucun plan tarifaire défini.</p>
          <p className="text-xs mt-1">Sans plan, les parents ne peuvent pas s'abonner à cette route.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`bg-bg-surface border rounded-xl p-4 flex items-center gap-3 ${
                p.isActive ? 'border-bg-elevated' : 'border-bg-elevated opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Tag size={16} className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{p.label}</span>
                  <code className="text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded text-ink-dim">
                    {p.code}
                  </code>
                  <span className="text-[10px] font-bold bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded">
                    {p.category}
                  </span>
                  {!p.isActive && (
                    <span className="text-[10px] font-bold bg-ink-faint/10 text-ink-dim px-1.5 py-0.5 rounded">
                      INACTIF
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-xs text-ink-dim mt-1">{p.description}</p>
                )}
                <div className="flex gap-3 mt-1 text-xs text-ink-dim">
                  <span>{p.dureeJours} jour{p.dureeJours > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>
                    {p.minStudents === p.maxStudents
                      ? `${p.minStudents} enfant${p.minStudents > 1 ? 's' : ''}`
                      : `${p.minStudents}-${p.maxStudents} enfants`}
                  </span>
                </div>
              </div>
              <p className="text-lg font-bold text-primary-300 flex-shrink-0">
                {Number(p.prix).toLocaleString('fr-FR')} Ar
              </p>
              <div className="flex gap-1">
                <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-bg-elevated" title="Modifier">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(p)} className="p-1.5 rounded hover:bg-danger-bg text-danger-400" title="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PlanFormDialog
          routeId={routeId}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function PlanFormDialog({
  routeId, existing, onClose, onSaved,
}: {
  routeId: string;
  existing: AdminPricingPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpsertPricingPlanDto>(
    existing
      ? {
          code: existing.code,
          label: existing.label,
          description: existing.description ?? '',
          category: existing.category,
          dureeJours: existing.dureeJours,
          prix: Number(existing.prix),
          minStudents: existing.minStudents,
          maxStudents: existing.maxStudents,
          isActive: existing.isActive,
          sortOrder: existing.sortOrder,
        }
      : {
          code: '',
          label: '',
          description: '',
          category: 'MONTHLY' as PlanCategory,
          dureeJours: 30,
          prix: 50000,
          minStudents: 1,
          maxStudents: 1,
          isActive: true,
          sortOrder: 0,
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await transportScolaireAdminApi.updatePlan(routeId, existing.id, form);
      } else {
        await transportScolaireAdminApi.createPlan(routeId, form);
      }
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
        className="bg-bg-surface border border-bg-elevated rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-lg">
            {existing ? 'Modifier le plan' : 'Nouveau plan tarifaire'}
          </h3>
          <button type="button" onClick={onClose} className="text-ink-dim hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PField
            label="Code (slug) *"
            value={form.code ?? ''}
            onChange={(v) => setForm({ ...form, code: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            placeholder="monthly-solo"
            disabled={!!existing}
          />
          <PField
            label="Catégorie *"
            select={[
              { value: 'MONTHLY', label: 'Mensuel' },
              { value: 'QUARTERLY', label: 'Trimestriel' },
              { value: 'PER_TRIP', label: 'Par trajet' },
              { value: 'OTHER', label: 'Autre' },
            ]}
            value={form.category ?? 'MONTHLY'}
            onChange={(v) => setForm({ ...form, category: v as PlanCategory })}
          />
        </div>

        <PField
          label="Libellé affiché *"
          value={form.label ?? ''}
          onChange={(v) => setForm({ ...form, label: v })}
          placeholder="Mensuel — 1 enfant"
        />
        <PField
          label="Description"
          value={form.description ?? ''}
          onChange={(v) => setForm({ ...form, description: v })}
          multiline
        />

        <div className="grid grid-cols-2 gap-3">
          <PField
            label="Durée (jours) *"
            type="number"
            value={String(form.dureeJours ?? 30)}
            onChange={(v) => setForm({ ...form, dureeJours: Number(v) || 30 })}
          />
          <PField
            label="Prix (Ar) *"
            type="number"
            value={String(form.prix ?? 0)}
            onChange={(v) => setForm({ ...form, prix: Number(v) || 0 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PField
            label="Min enfants"
            type="number"
            value={String(form.minStudents ?? 1)}
            onChange={(v) => setForm({ ...form, minStudents: Math.max(1, Number(v) || 1) })}
          />
          <PField
            label="Max enfants"
            type="number"
            value={String(form.maxStudents ?? 1)}
            onChange={(v) => setForm({ ...form, maxStudents: Math.max(1, Number(v) || 1) })}
          />
        </div>

        <PField
          label="Ordre d'affichage"
          type="number"
          value={String(form.sortOrder ?? 0)}
          onChange={(v) => setForm({ ...form, sortOrder: Number(v) || 0 })}
        />

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={!!form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Plan actif (visible côté parent)
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

// ═══════════════════════════════════════════════════════
//  STOPS
// ═══════════════════════════════════════════════════════

function StopsTab({
  routeId, stops, reload,
}: {
  routeId: string;
  stops: AdminStop[];
  reload: () => void;
}) {
  const [editing, setEditing] = useState<AdminStop | 'new' | null>(null);

  const handleDelete = async (s: AdminStop) => {
    if (!confirm(`Supprimer "${s.nom}" ? (refusé si abonnements actifs l'utilisent)`)) return;
    try {
      await transportScolaireAdminApi.removeStop(routeId, s.id);
      reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} />
          Nouvel arrêt
        </button>
      </div>

      {stops.length === 0 ? (
        <div className="bg-bg-surface border border-bg-elevated rounded-2xl p-8 text-center text-ink-dim">
          <MapPin size={32} className="mx-auto mb-3" />
          <p>Aucun arrêt défini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stops.map((s) => (
            <div
              key={s.id}
              className="bg-bg-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {s.ordre}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{s.nom}</p>
                <div className="flex items-center gap-3 text-xs text-ink-dim mt-0.5">
                  {s.heurePassage && <span>🕐 {s.heurePassage}</span>}
                  {s.latitude != null && s.longitude != null && (
                    <span>📍 {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(s)} className="p-1.5 rounded hover:bg-bg-elevated">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(s)} className="p-1.5 rounded hover:bg-danger-bg text-danger-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <StopFormDialog
          routeId={routeId}
          existing={editing === 'new' ? null : editing}
          maxOrdre={stops.length}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function StopFormDialog({
  routeId, existing, maxOrdre, onClose, onSaved,
}: {
  routeId: string;
  existing: AdminStop | null;
  maxOrdre: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpsertStopDto>(
    existing
      ? {
          nom: existing.nom,
          ordre: existing.ordre,
          heurePassage: existing.heurePassage ?? '',
          latitude: existing.latitude,
          longitude: existing.longitude,
        }
      : {
          nom: '',
          ordre: maxOrdre + 1,
          heurePassage: '',
          latitude: null,
          longitude: null,
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const dto: UpsertStopDto = {
        ...form,
        heurePassage: form.heurePassage?.trim() || null,
      };
      if (existing) await transportScolaireAdminApi.updateStop(routeId, existing.id, dto);
      else await transportScolaireAdminApi.createStop(routeId, dto);
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
        className="bg-bg-surface border border-bg-elevated rounded-2xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-lg">
            {existing ? 'Modifier l\'arrêt' : 'Nouvel arrêt'}
          </h3>
          <button type="button" onClick={onClose} className="text-ink-dim hover:text-ink p-1">
            <X size={18} />
          </button>
        </div>

        <PField label="Nom *" value={form.nom ?? ''} onChange={(v) => setForm({ ...form, nom: v })} placeholder="Carrefour Anosibe" />
        <div className="grid grid-cols-2 gap-3">
          <PField label="Ordre *" type="number" value={String(form.ordre ?? 1)} onChange={(v) => setForm({ ...form, ordre: Math.max(1, Number(v) || 1) })} />
          <PField label="Heure passage" value={form.heurePassage ?? ''} onChange={(v) => setForm({ ...form, heurePassage: v })} placeholder="06:45" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PField
            label="Latitude"
            value={form.latitude?.toString() ?? ''}
            onChange={(v) => setForm({ ...form, latitude: v ? Number(v) : null })}
          />
          <PField
            label="Longitude"
            value={form.longitude?.toString() ?? ''}
            onChange={(v) => setForm({ ...form, longitude: v ? Number(v) : null })}
          />
        </div>

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

function PField({
  label, value, onChange, placeholder, multiline, type, select, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  select?: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-dim">{label}</span>
      {select ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink disabled:opacity-50"
        >
          {select.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : multiline ? (
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
          disabled={disabled}
          className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink disabled:opacity-50"
        />
      )}
    </label>
  );
}
