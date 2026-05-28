import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Eye,
} from 'lucide-react';
import {
  Clock,
  CheckCircle2 as CheckIcon,
  ShieldCheck,
  PauseCircle as PauseIcon,
} from 'lucide-react';
import { merchantsAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface Merchant {
  id: string;
  nom: string;
  categorie: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED';
  verifiedAt?: string | null;
  submittedAt: string;
  createdAt: string;
}

const STATUSES = [
  '',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'RESUBMIT_REQUIRED',
] as const;

export default function Merchants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('validationStatus') ?? '';
  const isActive = searchParams.get('isActive') ?? '';
  const q = searchParams.get('q') ?? '';
  const [items, setItems] = useState<Merchant[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);
  const [selected, setSelected] = useState<Merchant | null>(null);
  const [action, setAction] =
    useState<'approve' | 'reject' | 'suspend' | 'reactivate' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        merchantsAdminApi.list({
          page: 1,
          limit: 50,
          q,
          validationStatus: status || undefined,
          isActive: isActive || undefined,
        }),
        merchantsAdminApi.stats(),
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
  }, [status, isActive, q]);

  function setParam(key: string, value: string) {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    setSearchParams(searchParams);
  }

  async function run() {
    if (!selected || !action) return;
    setErr(null);
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await merchantsAdminApi.approve(selected.id);
      } else if (action === 'reactivate') {
        await merchantsAdminApi.reactivate(selected.id);
      } else {
        if (reason.trim().length < 5) {
          setErr('Motif requis (5 caractères min)');
          setSubmitting(false);
          return;
        }
        if (action === 'reject') {
          await merchantsAdminApi.reject(selected.id, reason);
        } else {
          await merchantsAdminApi.suspend(selected.id, reason);
        }
      }
      setSelected(null);
      setAction(null);
      setReason('');
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
        icon={Store}
        title="Marchands"
        subtitle={`${stats?.active ?? 0} marchand${(stats?.active ?? 0) > 1 ? 's' : ''} actif${(stats?.active ?? 0) > 1 ? 's' : ''} sur la plateforme`}
      />

      {/* Stats cliquables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          icon={Clock}
          label="En attente"
          value={stats?.pending ?? 0}
          tone="warning"
          active={status === 'PENDING'}
          onClick={() => setParam('validationStatus', 'PENDING')}
        />
        <StatPill
          icon={CheckIcon}
          label="Approuvés"
          value={stats?.approved ?? 0}
          tone="success"
          active={status === 'APPROVED'}
          onClick={() => setParam('validationStatus', 'APPROVED')}
        />
        <StatPill
          icon={ShieldCheck}
          label="Actifs"
          value={stats?.active ?? 0}
          tone="brand"
          active={isActive === 'true'}
          onClick={() => setParam('isActive', 'true')}
        />
        <StatPill
          icon={PauseIcon}
          label="Suspendus"
          value={(stats?.approved ?? 0) - (stats?.active ?? 0)}
          tone="danger"
          active={isActive === 'false'}
          onClick={() => setParam('isActive', 'false')}
        />
      </div>

      <div className="card p-4 flex flex-wrap gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('q', searchInput);
          }}
          className="flex gap-2 flex-1 min-w-[280px]"
        >
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              className="input pl-9"
              placeholder="Nom, email, N° immatriculation"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => setParam('validationStatus', e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || 'Tous'}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={isActive}
          onChange={(e) => setParam('isActive', e.target.value)}
        >
          <option value="">Actif/Suspendu</option>
          <option value="true">Actifs</option>
          <option value="false">Suspendus</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Contact</th>
                <th>Validation</th>
                <th>État</th>
                <th>Inscrit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-3 w-28" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Store}
                      title="Aucun marchand"
                      description="Aucun résultat ne correspond aux critères."
                    />
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id}>
                    <td className="font-semibold">{m.nom}</td>
                    <td className="text-ink-muted">{m.categorie}</td>
                    <td>
                      <div className="text-xs">{m.email || '—'}</div>
                      <div className="text-xs text-ink-muted">
                        {m.phone || '—'}
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          m.validationStatus === 'APPROVED'
                            ? 'badge-success'
                            : m.validationStatus === 'PENDING'
                              ? 'badge-warning'
                              : m.validationStatus === 'REJECTED'
                                ? 'badge-danger'
                                : 'badge-info'
                        }
                      >
                        {m.validationStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          m.isActive ? 'badge-success' : 'badge-danger'
                        }
                      >
                        {m.isActive ? 'ACTIF' : 'SUSPENDU'}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right space-x-1">
                      <Link
                        to={`/merchants/${m.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye size={12} />
                      </Link>
                      {m.validationStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(m);
                              setAction('approve');
                            }}
                            className="btn btn-sm btn-success"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(m);
                              setAction('reject');
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            <XCircle size={12} />
                          </button>
                        </>
                      )}
                      {m.validationStatus === 'APPROVED' && m.isActive && (
                        <button
                          onClick={() => {
                            setSelected(m);
                            setAction('suspend');
                          }}
                          className="btn btn-sm btn-danger"
                        >
                          <PauseCircle size={12} />
                        </button>
                      )}
                      {m.validationStatus === 'APPROVED' && !m.isActive && (
                        <button
                          onClick={() => {
                            setSelected(m);
                            setAction('reactivate');
                          }}
                          className="btn btn-sm btn-success"
                        >
                          <PlayCircle size={12} />
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
              {action === 'approve' && 'Approuver le marchand'}
              {action === 'reject' && 'Refuser le marchand'}
              {action === 'suspend' && 'Suspendre le marchand'}
              {action === 'reactivate' && 'Réactiver le marchand'}
            </div>
            <div className="text-sm text-ink-muted mb-4">{selected.nom}</div>

            {(action === 'reject' || action === 'suspend') && (
              <div className="mb-4">
                <label className="label">Motif (obligatoire)</label>
                <textarea
                  className="input min-h-[80px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  setReason('');
                }}
                className="btn btn-md btn-ghost"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={run}
                disabled={submitting}
                className={`btn btn-md ${
                  action === 'reject' || action === 'suspend'
                    ? 'btn-danger'
                    : 'btn-success'
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
