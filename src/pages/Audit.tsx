import { Fragment, useEffect, useState } from 'react';
import {
  FileClock,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { auditApi } from '../services/superAdminApi';
import { useT } from '../contexts/LocaleContext';
import { useAdminSocket } from '../contexts/AdminSocketContext';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: string | null;
  ipAddress?: string | null;
  success: boolean;
  errorMessage?: string | null;
  createdAt: string;
  admin?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
}

const ACTION_TYPES = [
  '',
  'kyc',
  'merchant',
  'wallet',
  'withdrawal',
  'refund',
  'user',
  'ip',
  'fx',
  'reclamation',
  'broadcast',
];

export default function Audit() {
  const t = useT();
  const { lastAudit } = useAdminSocket();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    from: '',
    to: '',
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await auditApi.list({
        page,
        limit: 50,
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
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
  }, [page, filters]);

  // Refetch quand un nouveau log arrive en temps réel
  useEffect(() => {
    if (lastAudit && page === 1) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAudit]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={FileClock}
        title={t('nav.audit')}
        subtitle={`${total.toLocaleString('fr-FR')} entrée${total > 1 ? 's' : ''} · Toutes les actions sensibles des super-admins`}
      />

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Action</label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              className="input pl-9"
              placeholder="kyc.approve, wallet.freeze…"
              value={filters.action}
              onChange={(e) => {
                setPage(1);
                setFilters({ ...filters, action: e.target.value });
              }}
            />
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={filters.targetType}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, targetType: e.target.value });
            }}
          >
            <option value="">Tous</option>
            {['KYC', 'Merchant', 'Wallet', 'Withdrawal', 'Refund', 'User', 'IpBlacklist', 'FxRate', 'Reclamation', 'Notification'].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="label">Du</label>
          <input
            type="date"
            className="input"
            value={filters.from}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, from: e.target.value });
            }}
          />
        </div>
        <div>
          <label className="label">Au</label>
          <input
            type="date"
            className="input"
            value={filters.to}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, to: e.target.value });
            }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th></th>
                <th>{t('common.date')}</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Cible</th>
                <th>IP</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-4 w-14" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={FileClock}
                      title={t('common.empty')}
                      description="Aucune action enregistrée correspondant aux filtres."
                    />
                  </td>
                </tr>
              ) : (
                items.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className="cursor-pointer"
                      onClick={() =>
                        setExpanded(expanded === log.id ? null : log.id)
                      }
                    >
                      <td className="w-8">
                        {expanded === log.id ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </td>
                      <td className="text-xs text-ink-muted whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td>
                        {log.admin ? (
                          <div>
                            <div className="text-sm font-semibold">
                              {log.admin.prenom} {log.admin.nom}
                            </div>
                            <div className="text-xs text-ink-muted">
                              {log.admin.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-ink-dim font-mono text-xs">
                            {log.adminId}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-xs px-2 py-0.5 bg-brand-500/10 text-brand-300 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="text-xs">
                        <div className="font-semibold">{log.targetType}</div>
                        <div className="text-ink-muted font-mono">
                          {log.targetId.slice(0, 16)}
                          {log.targetId.length > 16 && '…'}
                        </div>
                      </td>
                      <td className="text-xs font-mono">
                        {log.ipAddress ?? '—'}
                      </td>
                      <td>
                        {log.success ? (
                          <CheckCircle2
                            size={14}
                            className="text-success-500"
                          />
                        ) : (
                          <XCircle size={14} className="text-danger-400" />
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr>
                        <td colSpan={7} className="bg-bg-elevated">
                          {log.errorMessage && (
                            <div className="text-xs text-danger-400 mb-2">
                              <span className="font-bold">Erreur :</span>{' '}
                              {log.errorMessage}
                            </div>
                          )}
                          <pre className="text-[10px] font-mono text-ink-muted whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                            {log.payload
                              ? (() => {
                                  try {
                                    return JSON.stringify(
                                      JSON.parse(log.payload),
                                      null,
                                      2,
                                    );
                                  } catch {
                                    return log.payload;
                                  }
                                })()
                              : '—'}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
                onClick={() => setPage(page - 1)}
                className="btn btn-sm btn-ghost"
              >
                ←
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
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
