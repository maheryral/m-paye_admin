import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  CheckCircle2,
  XCircle,
  Search,
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  Clock,
  CheckCheck,
  XOctagon,
  Ban,
} from 'lucide-react';
import { paymentRequestsAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface PaymentRequestRow {
  id: string;
  reference: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  method: 'MOBILE_MONEY' | 'CARD' | 'BANK' | 'CASH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  amount: string;
  devise: string;
  details?: any;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  user: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
  };
}

const METHOD_META: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  MOBILE_MONEY: {
    label: 'Mobile Money',
    icon: Smartphone,
    color: 'text-orange-400',
  },
  CARD: { label: 'Carte', icon: CreditCard, color: 'text-brand-300' },
  BANK: { label: 'Virement', icon: Building2, color: 'text-cyan-300' },
  CASH: { label: 'Espèces (agent)', icon: Banknote, color: 'text-success-500' },
};

export default function PaymentRequests() {
  const [items, setItems] = useState<PaymentRequestRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const [type, setType] = useState('');
  const [method, setMethod] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');

  // Modal action
  const [selected, setSelected] = useState<PaymentRequestRow | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        paymentRequestsAdminApi.list({
          status: status || undefined,
          type: type || undefined,
          method: method || undefined,
          q: q || undefined,
          limit: 50,
        }),
        paymentRequestsAdminApi.stats(),
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
  }, [status, type, method, q]);

  async function runAction() {
    if (!selected || !action) return;
    setErr(null);
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await paymentRequestsAdminApi.approve(
          selected.id,
          actionInput || undefined,
        );
      } else {
        if (actionInput.trim().length < 5) {
          setErr('Motif requis (5 caractères min)');
          setSubmitting(false);
          return;
        }
        await paymentRequestsAdminApi.reject(selected.id, actionInput);
      }
      setSelected(null);
      setAction(null);
      setActionInput('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Wallet}
        title="Dépôts & Retraits utilisateurs"
        subtitle="Validation des demandes wallet → bank et bank → wallet"
      />

      {/* Stats principales cliquables */}
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
          icon={CheckCheck}
          label="Approuvés"
          value={stats?.approved ?? 0}
          tone="success"
          active={status === 'APPROVED'}
          onClick={() => setStatus('APPROVED')}
        />
        <StatPill
          icon={XOctagon}
          label="Refusés"
          value={stats?.rejected ?? 0}
          tone="danger"
          active={status === 'REJECTED'}
          onClick={() => setStatus('REJECTED')}
        />
        <StatPill
          icon={Ban}
          label="Annulés"
          value={stats?.cancelled ?? 0}
          tone="brand"
          active={status === 'CANCELLED'}
          onClick={() => setStatus('CANCELLED')}
        />
      </div>

      {/* Volumes pending par type (cards informatives) */}
      {stats?.pending > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-success-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-success-bg text-success-500 ring-1 ring-success-500/20 flex items-center justify-center">
                <ArrowDownToLine size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-dim font-bold">
                  Dépôts à valider
                </div>
                <div className="text-xl font-bold">
                  {Number(stats.pendingDeposit.volume).toLocaleString('fr-FR')}{' '}
                  <span className="text-sm font-normal text-ink-muted">Ar</span>
                </div>
                <div className="text-xs text-ink-muted">
                  {stats.pendingDeposit.count} demande
                  {stats.pendingDeposit.count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setType('DEPOSIT');
                setStatus('PENDING');
              }}
              className="btn btn-sm btn-secondary relative"
            >
              Voir
            </button>
          </div>
          <div className="card p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-warning-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-warning-bg text-warning-500 ring-1 ring-warning-500/20 flex items-center justify-center">
                <ArrowUpFromLine size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-dim font-bold">
                  Retraits à valider
                </div>
                <div className="text-xl font-bold">
                  {Number(stats.pendingWithdrawal.volume).toLocaleString(
                    'fr-FR',
                  )}{' '}
                  <span className="text-sm font-normal text-ink-muted">Ar</span>
                </div>
                <div className="text-xs text-ink-muted">
                  {stats.pendingWithdrawal.count} demande
                  {stats.pendingWithdrawal.count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setType('WITHDRAWAL');
                setStatus('PENDING');
              }}
              className="btn btn-sm btn-secondary relative"
            >
              Voir
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(searchInput);
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              className="input pl-9"
              placeholder="Référence, email, téléphone, nom…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Tous types</option>
            <option value="DEPOSIT">Dépôt</option>
            <option value="WITHDRAWAL">Retrait</option>
          </select>
          <select
            className="input w-auto"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">Toutes méthodes</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARD">Carte</option>
            <option value="BANK">Virement bancaire</option>
            <option value="CASH">Espèces (agent)</option>
          </select>
        </form>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Utilisateur</th>
                <th>Type</th>
                <th>Méthode</th>
                <th className="text-right">Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-3 w-40" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-4 w-20 ml-auto" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Wallet}
                      title={`Aucune demande ${status.toLowerCase()}`}
                      description={
                        status === 'PENDING'
                          ? 'Aucune validation en attente — tout est à jour ✨'
                          : 'Cette catégorie est vide.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((r) => {
                  const meta = METHOD_META[r.method] ?? {
                    label: r.method,
                    icon: Wallet,
                    color: 'text-ink-muted',
                  };
                  const MethodIcon = meta.icon;
                  return (
                    <tr key={r.id}>
                      <td className="font-mono text-xs">{r.reference}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-brand-soft border border-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-300 shrink-0">
                            {r.user.prenom[0]?.toUpperCase()}
                            {r.user.nom[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">
                              {r.user.prenom} {r.user.nom}
                            </div>
                            <div className="text-xs text-ink-muted truncate">
                              {r.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            r.type === 'DEPOSIT'
                              ? 'badge-success inline-flex items-center gap-1'
                              : 'badge-warning inline-flex items-center gap-1'
                          }
                        >
                          {r.type === 'DEPOSIT' ? (
                            <ArrowDownToLine size={10} />
                          ) : (
                            <ArrowUpFromLine size={10} />
                          )}
                          {r.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait'}
                        </span>
                      </td>
                      <td>
                        <div
                          className={`inline-flex items-center gap-1.5 text-xs ${meta.color}`}
                        >
                          <MethodIcon size={12} />
                          {meta.label}
                        </div>
                      </td>
                      <td className="text-right font-bold">
                        {Number(r.amount).toLocaleString('fr-FR')}
                        <span className="text-ink-muted ml-1 text-xs font-normal">
                          {r.devise}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            r.status === 'PENDING'
                              ? 'badge-warning'
                              : r.status === 'APPROVED'
                                ? 'badge-success'
                                : r.status === 'REJECTED'
                                  ? 'badge-danger'
                                  : 'badge-info'
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
                                setActionInput('');
                                setErr(null);
                              }}
                              className="btn btn-sm btn-success"
                            >
                              <CheckCircle2 size={12} />
                              Valider
                            </button>
                            <button
                              onClick={() => {
                                setSelected(r);
                                setAction('reject');
                                setActionInput('');
                                setErr(null);
                              }}
                              className="btn btn-sm btn-danger"
                            >
                              <XCircle size={12} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approve / Reject */}
      {selected && action && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => !submitting && setSelected(null)}
        >
          <div
            className="card-elevated p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    action === 'approve'
                      ? 'bg-success-bg text-success-500 ring-1 ring-success-500/30'
                      : 'bg-danger-bg text-danger-400 ring-1 ring-danger-500/30'
                  }`}
                >
                  {action === 'approve' ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                </div>
                <div>
                  <div className="text-base font-bold">
                    {action === 'approve'
                      ? `Valider le ${selected.type === 'DEPOSIT' ? 'dépôt' : 'retrait'}`
                      : `Refuser la demande`}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {selected.user.prenom} {selected.user.nom} ·{' '}
                    {Number(selected.amount).toLocaleString('fr-FR')}{' '}
                    {selected.devise}
                  </div>
                </div>
              </div>
            </div>

            {/* Détails de la demande */}
            <div className="bg-bg-elevated/40 border border-bg-border rounded-xl p-3 text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-ink-muted">Référence</span>
                <span className="font-mono">{selected.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Méthode</span>
                <span>{METHOD_META[selected.method]?.label ?? selected.method}</span>
              </div>
              {selected.details && (
                <details className="pt-1">
                  <summary className="cursor-pointer text-ink-muted">
                    Détails techniques
                  </summary>
                  <pre className="text-[10px] mt-1 font-mono text-ink-dim whitespace-pre-wrap break-all">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            <label className="label">
              {action === 'approve'
                ? 'Note interne (optionnel)'
                : 'Motif du refus (obligatoire, min 5 car.)'}
            </label>
            <textarea
              className="input min-h-[90px] mb-3"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder={
                action === 'approve'
                  ? 'Ex: Reçu virement bancaire vérifié, code XYZ'
                  : 'Ex: Justificatif manquant, montant incohérent…'
              }
            />

            {err && (
              <div className="text-xs text-danger-400 bg-danger-bg/60 p-2 rounded-lg mb-3">
                {err}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelected(null);
                  setAction(null);
                  setActionInput('');
                }}
                disabled={submitting}
                className="btn btn-md btn-ghost"
              >
                Annuler
              </button>
              <button
                onClick={runAction}
                disabled={submitting}
                className={`btn btn-md ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
              >
                {submitting
                  ? 'Envoi…'
                  : action === 'approve'
                    ? `Confirmer ${selected.type === 'DEPOSIT' ? 'le crédit' : 'le débit'}`
                    : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
