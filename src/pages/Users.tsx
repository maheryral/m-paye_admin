import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users as UsersIcon, Search, Eye, Ban, Check } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { usersAdminApi } from '../services/superAdminApi';

interface UserRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  isActive: boolean;
  kycLevel: string;
  createdAt: string;
}

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const q = searchParams.get('q') ?? '';
  const role = searchParams.get('role') ?? '';
  const isActive = searchParams.get('isActive') ?? '';

  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  async function load() {
    setLoading(true);
    try {
      const res = await usersAdminApi.list({
        page,
        limit: 25,
        q,
        role,
        isActive,
      });
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, role, isActive]);

  function setParam(key: string, value: string) {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  }

  async function toggleActive(u: UserRow) {
    const verb = u.isActive ? 'désactiver' : 'réactiver';
    if (!confirm(`Voulez-vous ${verb} ${u.prenom} ${u.nom} ?`)) return;
    await usersAdminApi.setActive(u.id, !u.isActive);
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={UsersIcon}
        title="Utilisateurs"
        subtitle={`${total.toLocaleString('fr-FR')} utilisateur${total > 1 ? 's' : ''} dans la base`}
      />

      <div className="card p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('q', searchInput);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              className="input pl-9"
              placeholder="Nom, prénom, email, téléphone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={role}
            onChange={(e) => setParam('role', e.target.value)}
          >
            <option value="">Tous rôles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <select
            className="input w-auto"
            value={isActive}
            onChange={(e) => setParam('isActive', e.target.value)}
          >
            <option value="">Tous statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Désactivés</option>
          </select>
          <button type="submit" className="btn btn-md btn-primary">
            Chercher
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nom complet</th>
                <th>Contact</th>
                <th>Rôle</th>
                <th>KYC</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-3 w-40" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-14" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={UsersIcon}
                      title="Aucun utilisateur"
                      description="Aucun résultat ne correspond aux critères de recherche."
                    />
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-brand-soft border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
                          {u.prenom[0]?.toUpperCase()}
                          {u.nom[0]?.toUpperCase()}
                        </div>
                        <div className="font-semibold">
                          {u.prenom} {u.nom}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">{u.email}</div>
                      <div className="text-xs text-ink-muted">
                        {u.telephone}
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          u.role === 'SUPER_ADMIN'
                            ? 'badge-danger'
                            : u.role === 'ADMIN'
                              ? 'badge-info'
                              : 'badge-warning'
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="text-ink-muted">{u.kycLevel}</td>
                    <td>
                      <span
                        className={
                          u.isActive ? 'badge-success' : 'badge-danger'
                        }
                      >
                        {u.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right space-x-1">
                      <Link
                        to={`/users/${u.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye size={12} />
                      </Link>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        title={u.isActive ? 'Désactiver' : 'Réactiver'}
                      >
                        {u.isActive ? <Ban size={12} /> : <Check size={12} />}
                      </button>
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
                onClick={() => setParam('page', String(page - 1))}
                className="btn btn-sm btn-ghost"
              >
                ←
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setParam('page', String(page + 1))}
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
