import { useEffect, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Play,
  Clock,
  RefreshCw,
  XOctagon,
} from 'lucide-react';
import { withdrawalsAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface Withdrawal {
  id: string;
  reference: string;
  amount: string;
  fee: string;
  netAmount: string;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  createdAt: string;
  merchant: { id: string; nom: string; email?: string | null };
}

export default function Withdrawals() {
  const [status, setStatus] = useState<string>('PENDING');
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] =
    useState<'complete' | 'fail' | 'process' | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        withdrawalsAdminApi.list({ status, page: 1, limit: 50 }),
        withdrawalsAdminApi.stats(),
      ]);
      setItems(list.items);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function runAction() {
    if (!selected || !actionType) return;
    setErr(null);
    setSubmitting(true);
    try {
      if (actionType === 'process') {
        await withdrawalsAdminApi.start(selected.id);
      } else if (actionType === 'complete') {
        await withdrawalsAdminApi.complete(
          selected.id,
          actionInput || undefined,
        );
      } else if (actionType === 'fail') {
        if (actionInput.trim().length < 5) {
          setErr('Motif requis (5 caractères min)');
          setSubmitting(false);
          return;
        }
        await withdrawalsAdminApi.fail(selected.id, actionInput);
      }
      setSelected(null);
      setActionType(null);
      setActionInput('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur lors de l\'action');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Banknote}
        title="Retraits marchands"
        subtitle="Approbation des virements bancaires sortants"
      />

      {/* Stats cards cliquables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          icon={Clock}
          label="En attente"
          value={stats?.pending ?? 0}
          tone="warning"
          active={status === 'PENDING'}
          onClick={() => setStatus('PENDING')}
        />
        <StatPill
          icon={RefreshCw}
          label="En traitement"
          value={stats?.processing ?? 0}
          tone="brand"
          active={status === 'PROCESSING'}
          onClick={() => setStatus('PROCESSING')}
        />
        <StatPill
          icon={CheckCircle2}
          label="Complétés"
          value={stats?.completed ?? 0}
          tone="success"
          active={status === 'COMPLETED'}
          onClick={() => setStatus('COMPLETED')}
        />
        <StatPill
          icon={XOctagon}
          label="Échoués"
          value={stats?.failed ?? 0}
          tone="danger"
          active={status === 'FAILED'}
          onClick={() => setStatus('FAILED')}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Marchand</th>
                <th>Montant net</th>
                <th>Banque</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-28" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Banknote}
                      title={`Aucun retrait ${status.toLowerCase()}`}
                      description={
                        status === 'PENDING'
                          ? 'Aucun retrait en attente de validation.'
                          : 'Cette catégorie est vide.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((w) => (
                  <tr key={w.id}>
                    <td className="font-mono text-xs">{w.reference}</td>
                    <td className="font-semibold">{w.merchant.nom}</td>
                    <td className="font-bold">
                      {Number(w.netAmount).toLocaleString('fr-FR')} {w.currency}
                    </td>
                    <td className="text-ink-muted text-xs">
                      <div>{w.bankName || '—'}</div>
                      <div className="font-mono">{w.accountNumber}</div>
                    </td>
                    <td>
                      <span
                        className={
                          w.status === 'PENDING' || w.status === 'PROCESSING'
                            ? 'badge-warning'
                            : w.status === 'COMPLETED'
                              ? 'badge-success'
                              : 'badge-danger'
                        }
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(w.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-right space-x-1">
                      {w.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(w);
                              setActionType('process');
                            }}
                            className="btn btn-sm btn-secondary"
                            title="Marquer en cours"
                          >
                            <Play size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(w);
                              setActionType('complete');
                            }}
                            className="btn btn-sm btn-success"
                          >
                            <CheckCircle2 size={12} /> Valider
                          </button>
                          <button
                            onClick={() => {
                              setSelected(w);
                              setActionType('fail');
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            <XCircle size={12} /> Refuser
                          </button>
                        </>
                      )}
                      {w.status === 'PROCESSING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(w);
                              setActionType('complete');
                            }}
                            className="btn btn-sm btn-success"
                          >
                            <CheckCircle2 size={12} /> Compléter
                          </button>
                          <button
                            onClick={() => {
                              setSelected(w);
                              setActionType('fail');
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            <XCircle size={12} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && actionType && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => !submitting && setSelected(null)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-1">
              {actionType === 'complete' && 'Valider le virement'}
              {actionType === 'fail' && 'Refuser le retrait'}
              {actionType === 'process' && 'Démarrer le traitement'}
            </div>
            <div className="text-sm text-ink-muted mb-4">
              {selected.merchant.nom} —{' '}
              <span className="font-semibold text-ink">
                {Number(selected.netAmount).toLocaleString('fr-FR')}{' '}
                {selected.currency}
              </span>
            </div>

            {actionType !== 'process' && (
              <div className="mb-4">
                <label className="label">
                  {actionType === 'complete'
                    ? 'Référence bancaire (optionnel)'
                    : 'Motif du refus (obligatoire)'}
                </label>
                {actionType === 'fail' ? (
                  <textarea
                    className="input min-h-[80px]"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="Ex: RIB invalide, fonds insuffisants côté banque…"
                  />
                ) : (
                  <input
                    className="input"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="Ex: VIR-2026-005678"
                  />
                )}
              </div>
            )}

            {err && (
              <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg mb-3">
                {err}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelected(null);
                  setActionType(null);
                  setActionInput('');
                }}
                className="btn btn-md btn-ghost"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={runAction}
                disabled={submitting}
                className={`btn btn-md ${
                  actionType === 'fail' ? 'btn-danger' : 'btn-success'
                }`}
              >
                {submitting ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
