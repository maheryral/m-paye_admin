import { useEffect, useState } from 'react';
import {
  Undo2,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { refundsAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface Refund {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  merchant: { id: string; nom: string };
  transactionId: string;
}

export default function Refunds() {
  const [status, setStatus] = useState<string>('PENDING');
  const [items, setItems] = useState<Refund[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Refund | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | 'complete' | null>(
    null,
  );
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        refundsAdminApi.list({ status, page: 1, limit: 50 }),
        refundsAdminApi.stats(),
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

  async function run() {
    if (!selected || !action) return;
    setErr(null);
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await refundsAdminApi.approve(selected.id, note || undefined);
      } else if (action === 'complete') {
        await refundsAdminApi.complete(selected.id);
      } else {
        if (note.trim().length < 5) {
          setErr('Motif requis (5 caractères min)');
          setSubmitting(false);
          return;
        }
        await refundsAdminApi.reject(selected.id, note);
      }
      setSelected(null);
      setAction(null);
      setNote('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Undo2}
        title="Remboursements"
        subtitle="Validation des demandes de refund marchands"
      />

      {/* Stats cliquables */}
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
          icon={CheckCircle2}
          label="Approuvés"
          value={stats?.approved ?? 0}
          tone="brand"
          active={status === 'APPROVED'}
          onClick={() => setStatus('APPROVED')}
        />
        <StatPill
          icon={CheckCheck}
          label="Complétés"
          value={stats?.completed ?? 0}
          tone="success"
          active={status === 'COMPLETED'}
          onClick={() => setStatus('COMPLETED')}
        />
        <StatPill
          icon={XCircle}
          label="Refusés"
          value={stats?.rejected ?? 0}
          tone="danger"
          active={status === 'REJECTED'}
          onClick={() => setStatus('REJECTED')}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Marchand</th>
                <th>Montant</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Date</th>
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
                    <td><div className="skeleton h-3 w-40" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Undo2}
                      title="Aucun remboursement"
                      description="Aucun refund dans cette catégorie."
                    />
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.reference}</td>
                    <td className="font-semibold">{r.merchant.nom}</td>
                    <td className="font-bold">
                      {Number(r.amount).toLocaleString('fr-FR')} {r.currency}
                    </td>
                    <td className="max-w-xs truncate text-ink-muted">
                      {r.reason}
                    </td>
                    <td>
                      <span
                        className={
                          r.status === 'PENDING'
                            ? 'badge-warning'
                            : r.status === 'APPROVED'
                              ? 'badge-info'
                              : r.status === 'COMPLETED'
                                ? 'badge-success'
                                : 'badge-danger'
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(r.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-right space-x-1">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(r);
                              setAction('approve');
                            }}
                            className="btn btn-sm btn-success"
                          >
                            <CheckCircle2 size={12} /> Approuver
                          </button>
                          <button
                            onClick={() => {
                              setSelected(r);
                              setAction('reject');
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            <XCircle size={12} />
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => {
                            setSelected(r);
                            setAction('complete');
                          }}
                          className="btn btn-sm btn-success"
                        >
                          <Truck size={12} /> Marquer complété
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && action && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => !submitting && setSelected(null)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-1">
              {action === 'approve' && 'Approuver le remboursement'}
              {action === 'reject' && 'Refuser le remboursement'}
              {action === 'complete' && 'Marquer comme complété'}
            </div>
            <div className="text-sm text-ink-muted mb-4">
              {selected.merchant.nom} —{' '}
              <span className="font-semibold text-ink">
                {Number(selected.amount).toLocaleString('fr-FR')}{' '}
                {selected.currency}
              </span>
            </div>

            {action !== 'complete' && (
              <div className="mb-4">
                <label className="label">
                  {action === 'reject'
                    ? 'Motif du refus (obligatoire)'
                    : 'Note interne (optionnelle)'}
                </label>
                <textarea
                  className="input min-h-[80px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
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
                  setAction(null);
                  setNote('');
                }}
                className="btn btn-md btn-ghost"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={run}
                disabled={submitting}
                className={`btn btn-md ${action === 'reject' ? 'btn-danger' : 'btn-success'}`}
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
