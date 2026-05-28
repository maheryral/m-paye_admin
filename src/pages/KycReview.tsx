import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { kycAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import FilterTabs from '../components/ui/FilterTabs';
import EmptyState from '../components/ui/EmptyState';

interface KycItem {
  id: string;
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export default function KycReview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'PENDING';
  const page = Number(searchParams.get('page') ?? '1');

  const [items, setItems] = useState<KycItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    pending: number;
    approved: number;
    rejected: number;
  } | null>(null);

  const filterParams = useMemo(
    () => ({ status, page, limit: 20 }),
    [status, page],
  );

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        kycAdminApi.list(filterParams),
        kycAdminApi.stats(),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setPages(list.pages);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  function setStatus(s: string) {
    searchParams.set('status', s);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Vérifications KYC"
        subtitle={`${total.toLocaleString('fr-FR')} dossier${total > 1 ? 's' : ''} ${status === 'PENDING' ? 'en attente' : status === 'APPROVED' ? 'approuvé(s)' : 'refusé(s)'}`}
      />

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          label="Approuvées"
          value={stats?.approved ?? 0}
          tone="success"
          active={status === 'APPROVED'}
          onClick={() => setStatus('APPROVED')}
        />
        <StatPill
          icon={XCircle}
          label="Refusées"
          value={stats?.rejected ?? 0}
          tone="danger"
          active={status === 'REJECTED'}
          onClick={() => setStatus('REJECTED')}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Soumis le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-3 w-40" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ShieldCheck}
                      title={`Aucun dossier ${status.toLowerCase()}`}
                      description={
                        status === 'PENDING'
                          ? 'Aucune vérification en attente — bon travail !'
                          : 'Cette catégorie est vide.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-brand-soft border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
                          {k.user.prenom[0]?.toUpperCase()}
                          {k.user.nom[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {k.user.prenom} {k.user.nom}
                          </div>
                          <div className="text-xs text-ink-muted">
                            {k.user.telephone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-ink-muted">{k.user.email}</td>
                    <td>
                      <span className="badge-info">{k.level}</span>
                    </td>
                    <td>
                      <span
                        className={
                          k.status === 'PENDING'
                            ? 'badge-warning'
                            : k.status === 'APPROVED'
                              ? 'badge-success'
                              : 'badge-danger'
                        }
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(k.submittedAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/kyc/${k.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye size={12} />
                        Examiner
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-5 py-3 border-t border-bg-border/60 flex items-center justify-between text-xs text-ink-muted">
            <div>
              Page <span className="text-ink font-semibold">{page}</span> /{' '}
              {pages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  searchParams.set('page', String(page - 1));
                  setSearchParams(searchParams);
                }}
                className="btn btn-sm btn-secondary"
              >
                ← Précédent
              </button>
              <button
                disabled={page >= pages}
                onClick={() => {
                  searchParams.set('page', String(page + 1));
                  setSearchParams(searchParams);
                }}
                className="btn btn-sm btn-secondary"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
