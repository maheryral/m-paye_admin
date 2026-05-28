import { useEffect, useState } from 'react';
import { Snowflake, Search, Sun, ShieldCheck, Coins } from 'lucide-react';
import { walletsAdminApi } from '../services/superAdminApi';
import { useT } from '../contexts/LocaleContext';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface Wallet {
  id: string;
  soldeDisponible: string;
  devise: string;
  isFrozen: boolean;
  frozenReason?: string | null;
  frozenAt?: string | null;
  account: {
    user: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
      isActive: boolean;
    };
  };
  merchant?: { id: string; nom: string } | null;
}

export default function Wallets() {
  const t = useT();
  const [filter, setFilter] = useState<'all' | 'frozen' | 'active'>('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Wallet | null>(null);
  const [action, setAction] = useState<'freeze' | 'unfreeze' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        walletsAdminApi.list({
          page: 1,
          limit: 50,
          isFrozen:
            filter === 'frozen' ? 'true' : filter === 'active' ? 'false' : '',
          q: q || undefined,
        }),
        walletsAdminApi.stats(),
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
  }, [filter, q]);

  async function run() {
    if (!selected || !action) return;
    setErr(null);
    setBusy(true);
    try {
      if (action === 'freeze') {
        if (reason.trim().length < 5) {
          setErr(t('common.reason') + ' (5+)');
          setBusy(false);
          return;
        }
        await walletsAdminApi.freeze(selected.id, reason);
      } else {
        await walletsAdminApi.unfreeze(selected.id);
      }
      setSelected(null);
      setAction(null);
      setReason('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Snowflake}
        title={t('nav.wallets')}
        subtitle={`${stats?.total ?? 0} wallets dans la plateforme`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatPill
          icon={ShieldCheck}
          label="Actifs"
          value={stats?.active ?? 0}
          tone="success"
          active={filter === 'active'}
          onClick={() => setFilter('active')}
        />
        <StatPill
          icon={Snowflake}
          label="Gelés"
          value={stats?.frozen ?? 0}
          tone="danger"
          active={filter === 'frozen'}
          onClick={() => setFilter('frozen')}
        />
        <StatPill
          icon={Coins}
          label="Liquidité totale"
          value={Number(stats?.totalLiquidity ?? 0).toLocaleString('fr-FR')}
          tone="brand"
        />
      </div>

      <div className="card p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <input
            className="input pl-9"
            placeholder={t('common.search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'frozen'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f === 'all' ? 'Tous' : f === 'frozen' ? 'Gelés' : 'Actifs'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>ID Wallet</th>
                <th>Propriétaire</th>
                <th>Solde</th>
                <th>{t('common.status')}</th>
                <th>Motif gel</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-3 w-40" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-7 w-20" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Snowflake}
                      title={t('common.empty')}
                      description="Aucun wallet ne correspond à ce filtre."
                    />
                  </td>
                </tr>
              ) : (
                items.map((w) => (
                  <tr key={w.id}>
                    <td className="font-mono text-xs">{w.id.slice(0, 12)}…</td>
                    <td>
                      {w.merchant ? (
                        <span className="font-semibold">
                          {w.merchant.nom}{' '}
                          <span className="badge-info ml-1">MERCHANT</span>
                        </span>
                      ) : (
                        <div>
                          <div className="font-semibold">
                            {w.account.user.prenom} {w.account.user.nom}
                          </div>
                          <div className="text-xs text-ink-muted">
                            {w.account.user.email}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="font-bold">
                      {Number(w.soldeDisponible).toLocaleString('fr-FR')}{' '}
                      {w.devise}
                    </td>
                    <td>
                      <span
                        className={w.isFrozen ? 'badge-danger' : 'badge-success'}
                      >
                        {w.isFrozen ? 'GELÉ' : 'ACTIF'}
                      </span>
                    </td>
                    <td className="text-xs text-ink-muted max-w-[200px] truncate">
                      {w.frozenReason ?? '—'}
                    </td>
                    <td className="text-right">
                      {w.isFrozen ? (
                        <button
                          onClick={() => {
                            setSelected(w);
                            setAction('unfreeze');
                          }}
                          className="btn btn-sm btn-success"
                        >
                          <Sun size={12} /> Dégeler
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelected(w);
                            setAction('freeze');
                          }}
                          className="btn btn-sm btn-danger"
                        >
                          <Snowflake size={12} /> Geler
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
          onClick={() => !busy && setSelected(null)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-1">
              {action === 'freeze' ? 'Geler ce wallet' : 'Dégeler ce wallet'}
            </div>
            <div className="text-sm text-ink-muted mb-4 font-mono">
              {selected.id}
            </div>

            {action === 'freeze' && (
              <div className="mb-4">
                <label className="label">
                  {t('common.reason')} ({t('common.required')})
                </label>
                <textarea
                  className="input min-h-[80px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Activité suspecte, demande d'enquête…"
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
                disabled={busy}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={run}
                disabled={busy}
                className={`btn btn-md ${action === 'freeze' ? 'btn-danger' : 'btn-success'}`}
              >
                {busy ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
