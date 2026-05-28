import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Search,
  Eye,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { transactionsAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

interface Tx {
  id: string;
  reference: string;
  type: string;
  montant: string;
  devise: string;
  statut: string;
  date: string;
  motif?: string | null;
  feeAmount?: string | null;
  merchant?: { id: string; nom: string } | null;
}

const TYPES = ['', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND'];
const STATUS = ['', 'SUCCESS', 'PENDING', 'FAILED'];

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';
  const statut = searchParams.get('statut') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const [items, setItems] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [sums, setSums] = useState<{ volume: string; fees: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  const filters = useMemo(
    () => ({ page, limit: 25, q, type, statut, from, to }),
    [page, q, type, statut, from, to],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await transactionsAdminApi.list(filters);
        setItems(res.items);
        setTotal(res.total);
        setPages(res.pages);
        setSums(res.sums);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  function applyFilter(key: string, value: string) {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilter('q', searchInput);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={ArrowLeftRight}
        title="Transactions"
        subtitle={`${total.toLocaleString('fr-FR')} transaction${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`}
      />

      {/* Sums cards */}
      {sums && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/20 flex items-center justify-center">
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-dim font-bold">
                  Total tx
                </div>
                <div className="text-2xl font-bold">
                  {total.toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-success-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-success-bg text-success-500 ring-1 ring-success-500/20 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-dim font-bold">
                  Volume (success)
                </div>
                <div className="text-2xl font-bold">
                  {Number(sums.volume).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-warning-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-warning-bg text-warning-500 ring-1 ring-warning-500/20 flex items-center justify-center">
                <Percent size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-dim font-bold">
                  Frais collectés
                </div>
                <div className="text-2xl font-bold">
                  {Number(sums.fees).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card p-4 mb-4 space-y-3">
        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              className="input pl-9"
              placeholder="Rechercher par référence, idempotency key, motif…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            Chercher
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => applyFilter('type', e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t || 'Tous'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={statut}
              onChange={(e) => applyFilter('statut', e.target.value)}
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s || 'Tous'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Du</label>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => applyFilter('from', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Au</label>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => applyFilter('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Frais</th>
                <th>Marchand</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-28" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-3 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-10" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={ArrowLeftRight}
                      title="Aucune transaction"
                      description="Aucun résultat ne correspond aux critères de filtrage."
                    />
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs">{t.reference}</td>
                    <td>{t.type}</td>
                    <td className="font-bold">
                      {Number(t.montant).toLocaleString('fr-FR')} {t.devise}
                    </td>
                    <td className="text-ink-muted">
                      {t.feeAmount
                        ? Number(t.feeAmount).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td className="text-ink-muted">{t.merchant?.nom ?? '—'}</td>
                    <td>
                      <span
                        className={
                          t.statut === 'SUCCESS'
                            ? 'badge-success'
                            : t.statut === 'FAILED'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }
                      >
                        {t.statut}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(t.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/transactions/${t.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-5 py-3 border-t border-bg-border flex items-center justify-between text-xs text-ink-muted">
            <div>
              Page {page} / {pages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => applyFilter('page', String(page - 1))}
                className="btn btn-sm btn-ghost"
              >
                ←
              </button>
              <button
                disabled={page >= pages}
                onClick={() => applyFilter('page', String(page + 1))}
                className="btn btn-sm btn-ghost"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
