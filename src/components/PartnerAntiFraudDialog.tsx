// src/components/PartnerAntiFraudDialog.tsx
// Modal qui regroupe les outils anti-fraude pour un partenaire :
//   - Onglet "Anomalies" : rapport calculé à la demande (24h / 7j / 30j) + flags
//   - Onglet "Velocity" : CRUD des limites par-partenaire / par-user

import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  partnersAdminApi,
  type AnomalyReport,
  type AnomalyFlag,
  type Partner,
  type PartnerVelocityLimit,
  type UpsertVelocityLimitDto,
  type WindowStats,
} from '../services/superAdminApi';

type Tab = 'anomalies' | 'velocity';

export default function PartnerAntiFraudDialog({
  partner,
  onClose,
}: {
  partner: Partner;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('anomalies');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-surface border border-bg-elevated rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-elevated flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Anti-fraude</h2>
            <p className="text-xs text-ink-dim mt-0.5">
              <span className="font-medium">{partner.name}</span>{' '}
              <span className="font-mono text-ink-faint">· {partner.appId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-elevated rounded text-ink-dim"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-1 border-b border-bg-elevated">
          {(['anomalies', 'velocity'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-primary-500 text-ink'
                  : 'border-transparent text-ink-dim hover:text-ink'
              }`}
            >
              {t === 'anomalies' ? 'Rapport d\'anomalies' : 'Limites velocity'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'anomalies' ? (
            <AnomaliesTab partnerId={partner.id} />
          ) : (
            <VelocityTab partnerId={partner.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  ANOMALIES
// ═══════════════════════════════════════════════════════

function AnomaliesTab({ partnerId }: { partnerId: string }) {
  const [report, setReport] = useState<AnomalyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await partnersAdminApi.anomalies(partnerId);
      setReport(r);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    );
  }
  if (error || !report) {
    return (
      <div className="text-danger-400 text-sm">{error ?? 'Indisponible'}</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + bouton refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-dim">
          Rapport calculé à{' '}
          <span className="font-mono">
            {new Date(report.computedAt).toLocaleString('fr-FR')}
          </span>
        </p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded hover:bg-bg-elevated text-ink-dim"
        >
          <RefreshCw size={12} />
          Recalculer
        </button>
      </div>

      {/* Flags */}
      <FlagsList flags={report.flags} />

      {/* Fenêtres */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">
          Activité par fenêtre
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <WindowCard label="24 dernières heures" stats={report.windows.last24h} />
          <WindowCard label="7 derniers jours" stats={report.windows.last7d} />
          <WindowCard label="30 derniers jours" stats={report.windows.last30d} />
        </div>
      </div>

      {/* Webhooks */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Santé webhooks</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Abandonnés 24h"
            value={report.webhooks.abandoned24h.toString()}
            danger={report.webhooks.abandoned24h > 5}
          />
          <StatCard
            label="Abandonnés 7j"
            value={report.webhooks.abandoned7d.toString()}
          />
          <StatCard
            label="Tentatives moy."
            value={report.webhooks.avgRetryCount.toFixed(2)}
          />
        </div>
      </div>
    </div>
  );
}

function FlagsList({ flags }: { flags: AnomalyFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="bg-success-bg/30 border border-success-400/30 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-success-400 flex-shrink-0" />
        <div>
          <p className="font-medium text-ink text-sm">Aucune anomalie détectée</p>
          <p className="text-xs text-ink-dim mt-0.5">
            Tous les indicateurs sont dans la norme.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">
        Flags actifs ({flags.length})
      </h3>
      {flags.map((f) => (
        <FlagRow key={f.code + f.severity} flag={f} />
      ))}
    </div>
  );
}

function FlagRow({ flag }: { flag: AnomalyFlag }) {
  const isAlert = flag.severity === 'ALERT';
  return (
    <div
      className={`rounded-lg border p-3 flex items-start gap-3 ${
        isAlert
          ? 'bg-danger-bg/30 border-danger-400/30'
          : 'bg-warning-bg/30 border-warning-400/30'
      }`}
    >
      {isAlert ? (
        <AlertOctagon className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isAlert
                ? 'bg-danger-400/20 text-danger-400'
                : 'bg-warning-400/20 text-warning-400'
            }`}
          >
            {flag.severity}
          </span>
          <span className="font-mono text-xs text-ink-dim">{flag.code}</span>
        </div>
        <p className="text-sm text-ink mt-1">{flag.message}</p>
      </div>
    </div>
  );
}

function WindowCard({ label, stats }: { label: string; stats: WindowStats }) {
  return (
    <div className="bg-bg-elevated/40 rounded-lg p-3 border border-bg-elevated">
      <p className="text-xs font-medium text-ink-dim mb-2">{label}</p>
      <div className="space-y-1.5 text-xs">
        <Row label="Total trades" value={stats.tradesTotal.toString()} />
        <Row label="Payés" value={stats.tradesPaid.toString()} />
        <Row label="Échoués" value={stats.tradesFailed.toString()} />
        <Row label="Remboursés" value={stats.tradesRefunded.toString()} />
        <Row label="Taux échec" value={pct(stats.failureRate)} />
        <Row label="Taux refund" value={pct(stats.refundRate)} />
        <Row
          label="Montant total"
          value={`${fmt(stats.totalAmount)} Ar`}
        />
        <Row label="Panier moyen" value={`${fmt(stats.avgAmount)} Ar`} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-dim">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        danger
          ? 'bg-danger-bg/30 border-danger-400/30'
          : 'bg-bg-elevated/40 border-bg-elevated'
      }`}
    >
      <p className="text-xs text-ink-dim">{label}</p>
      <p
        className={`text-xl font-bold mt-1 ${
          danger ? 'text-danger-400' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  VELOCITY LIMITS
// ═══════════════════════════════════════════════════════

function VelocityTab({ partnerId }: { partnerId: string }) {
  const [items, setItems] = useState<PartnerVelocityLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PartnerVelocityLimit | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await partnersAdminApi.listVelocityLimits(partnerId));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (limit: PartnerVelocityLimit) => {
    if (!confirm(`Supprimer cette limite ${limit.scope} ?`)) return;
    try {
      await partnersAdminApi.removeVelocityLimit(partnerId, limit.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-dim">
          Plafonds appliqués AVANT le débit. PARTNER s'applique par défaut ; USER
          (override) écrase PARTNER pour un user spécifique.
        </p>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded"
        >
          <Plus size={14} />
          Nouvelle limite
        </button>
      </div>

      {error && (
        <div className="bg-danger-bg/30 border border-danger-400/30 rounded p-3 text-sm text-danger-400">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-ink-dim text-sm">
          Aucune limite définie pour ce partenaire.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-dim uppercase border-b border-bg-elevated">
              <tr>
                <th className="px-3 py-2 text-left">Scope</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-right">Par tx</th>
                <th className="px-3 py-2 text-right">Jour</th>
                <th className="px-3 py-2 text-right">Semaine</th>
                <th className="px-3 py-2 text-right">Mois</th>
                <th className="px-3 py-2 text-center">Actif</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-bg-elevated/60 hover:bg-bg-elevated/20"
                >
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        l.scope === 'USER'
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-ink-faint/10 text-ink-dim'
                      }`}
                    >
                      {l.scope}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-dim">
                    {l.scopeId ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right">{fmtN(l.perTransaction)}</td>
                  <td className="px-3 py-2 text-right">{fmtN(l.perDay)}</td>
                  <td className="px-3 py-2 text-right">{fmtN(l.perWeek)}</td>
                  <td className="px-3 py-2 text-right">{fmtN(l.perMonth)}</td>
                  <td className="px-3 py-2 text-center">
                    {l.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-success-400 inline" />
                    ) : (
                      <X className="w-4 h-4 text-ink-faint inline" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditing(l)}
                        className="p-1 rounded hover:bg-bg-elevated"
                        title="Modifier"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
                        className="p-1 rounded hover:bg-danger-bg text-danger-400"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
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
        <VelocityForm
          partnerId={partnerId}
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

function VelocityForm({
  partnerId,
  existing,
  onClose,
  onSaved,
}: {
  partnerId: string;
  existing: PartnerVelocityLimit | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scope, setScope] = useState<'PARTNER' | 'USER'>(
    existing?.scope ?? 'PARTNER',
  );
  const [scopeId, setScopeId] = useState(existing?.scopeId ?? '');
  const [perTransaction, setPerTransaction] = useState(
    fmtField(existing?.perTransaction),
  );
  const [perDay, setPerDay] = useState(fmtField(existing?.perDay));
  const [perWeek, setPerWeek] = useState(fmtField(existing?.perWeek));
  const [perMonth, setPerMonth] = useState(fmtField(existing?.perMonth));
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const dto: UpsertVelocityLimitDto = {
        scope,
        scopeId: scope === 'USER' ? scopeId.trim() : null,
        perTransaction: parseNum(perTransaction),
        perDay: parseNum(perDay),
        perWeek: parseNum(perWeek),
        perMonth: parseNum(perMonth),
        isActive,
        notes: notes.trim() || null,
      };
      await partnersAdminApi.upsertVelocityLimit(partnerId, dto);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="bg-bg-surface border border-bg-elevated rounded-2xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-ink">
          {existing ? 'Modifier la limite' : 'Nouvelle limite velocity'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-ink-dim">Scope</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              disabled={!!existing}
              className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink"
            >
              <option value="PARTNER">PARTNER (défaut)</option>
              <option value="USER">USER (override)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink-dim">User ID (si USER)</span>
            <input
              type="text"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              disabled={scope !== 'USER' || !!existing}
              placeholder="cuid du user"
              className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink font-mono"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Par transaction (Ar)"
            value={perTransaction}
            onChange={setPerTransaction}
          />
          <NumField
            label="Par jour (Ar)"
            value={perDay}
            onChange={setPerDay}
          />
          <NumField
            label="Par semaine (Ar)"
            value={perWeek}
            onChange={setPerWeek}
          />
          <NumField
            label="Par mois (Ar)"
            value={perMonth}
            onChange={setPerMonth}
          />
        </div>

        <label className="block">
          <span className="text-xs text-ink-dim">Notes (interne)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Limite active
        </label>

        {error && (
          <div className="bg-danger-bg/30 border border-danger-400/30 rounded p-2 text-xs text-danger-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-ink-dim hover:bg-bg-elevated rounded"
          >
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

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ink-dim">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="mt-1 w-full bg-bg-elevated border border-bg-elevated rounded px-2 py-1.5 text-sm text-ink font-mono"
      />
    </label>
  );
}

// ─── Helpers ─────────────

function fmt(n: number) {
  return n.toLocaleString('fr-FR');
}
function pct(n: number) {
  return (n * 100).toFixed(1) + '%';
}
function fmtN(v: string | number | null) {
  if (v == null) return '—';
  return Number(v).toLocaleString('fr-FR');
}
function fmtField(v: string | number | null | undefined) {
  if (v == null) return '';
  return String(Number(v));
}
function parseNum(s: string): number | null {
  const t = s.trim().replace(/\s/g, '').replace(/,/g, '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}
