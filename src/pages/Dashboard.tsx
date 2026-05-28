import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  ShieldAlert,
  Banknote,
  TrendingUp,
  ArrowRight,
  Activity,
  PieChart as PieIcon,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { dashboardApi } from '../services/superAdminApi';
import { useT } from '../contexts/LocaleContext';
import { useAdminSocket } from '../contexts/AdminSocketContext';

interface Overview {
  users: { total: number; active: number };
  merchants: { total: number; verified: number };
  pendingActions: { kyc: number; withdrawals: number };
  transactions: {
    today: { count: number; volume: string };
    month: { count: number; volume: string };
  };
  revenueMonth: { amount: string; count: number };
}

interface RecentTx {
  id: string;
  type: string;
  montant: string;
  devise: string;
  statut: string;
  date: string;
  reference: string;
}

interface ChartsData {
  timeline: { date: string; count: number; volume: number }[];
  byType: { type: string; count: number; volume: string }[];
  usersGrowth: { date: string; total: number }[];
}

const TYPE_COLORS: Record<string, string> = {
  DEPOT: '#10b981',
  RETRAIT: '#f59e0b',
  TRANSFERT: '#7c75f2',
  PAIEMENT: '#22d3ee',
  REMBOURSEMENT: '#f43f5e',
};

function pickColor(type: string, i: number) {
  if (TYPE_COLORS[type]) return TYPE_COLORS[type];
  const fallback = ['#7c75f2', '#22d3ee', '#10b981', '#f59e0b', '#f43f5e', '#a78bfa'];
  return fallback[i % fallback.length];
}

function fmtShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-bg-border/80 bg-bg-surface/95 backdrop-blur-md px-3 py-2 shadow-lg text-xs">
      {label && (
        <div className="text-ink-dim mb-1 text-[10px] uppercase tracking-wider">
          {typeof label === 'string' && label.includes('-')
            ? fmtShortDate(label)
            : label}
        </div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-ink-muted">{p.name}:</span>
          <span className="font-bold text-ink">
            {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// StatCard — version premium avec gradient + icône XL
// ============================================================
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'brand',
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'cyan';
  to?: string;
}) {
  const tones = {
    brand: {
      ring: 'hover:ring-brand-500/30',
      bg: 'from-brand-500/[0.08] to-transparent',
      icon: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/20',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(124,117,242,0.4)]',
    },
    success: {
      ring: 'hover:ring-success-500/30',
      bg: 'from-success-500/[0.08] to-transparent',
      icon: 'bg-success-bg text-success-500 ring-1 ring-success-500/20',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
    },
    warning: {
      ring: 'hover:ring-warning-500/30',
      bg: 'from-warning-500/[0.08] to-transparent',
      icon: 'bg-warning-bg text-warning-500 ring-1 ring-warning-500/20',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]',
    },
    danger: {
      ring: 'hover:ring-danger-500/30',
      bg: 'from-danger-500/[0.08] to-transparent',
      icon: 'bg-danger-bg text-danger-500 ring-1 ring-danger-500/20',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(244,63,94,0.4)]',
    },
    cyan: {
      ring: 'hover:ring-cyan-500/30',
      bg: 'from-cyan-500/[0.08] to-transparent',
      icon: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)]',
    },
  }[tone];

  const inner = (
    <div
      className={`relative card p-5 overflow-hidden group transition-all duration-300 ring-1 ring-transparent ${tones.ring} ${tones.glow}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tones.bg} pointer-events-none`}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="stat-label">{label}</div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones.icon}`}
          >
            <Icon size={18} strokeWidth={2.25} />
          </div>
        </div>
        <div className="stat-value">{value}</div>
        {sub && (
          <div className="text-xs text-ink-muted mt-1.5 truncate">{sub}</div>
        )}
      </div>
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ============================================================
// Skeleton loader
// ============================================================
function StatSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton w-10 h-10 rounded-xl" />
      </div>
      <div className="skeleton h-7 w-24 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}

// ============================================================
// Dashboard
// ============================================================
export default function Dashboard() {
  const t = useT();
  const { connected, pending, lastAudit, lastTx } = useAdminSocket();
  const [data, setData] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [overview, txs, ch] = await Promise.all([
        dashboardApi.overview(),
        dashboardApi.recentTransactions(10),
        dashboardApi.charts(),
      ]);
      setData(overview);
      setRecent(txs);
      setCharts(ch);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (lastAudit) load();
  }, [lastAudit]);

  useEffect(() => {
    if (lastTx) {
      setRecent((prev) => [lastTx as any, ...prev].slice(0, 10));
    }
  }, [lastTx]);

  const effectivePending = {
    kyc: pending?.kyc ?? data?.pendingActions.kyc ?? 0,
    withdrawals: pending?.withdrawals ?? data?.pendingActions.withdrawals ?? 0,
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-ink to-ink-muted bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border backdrop-blur-sm ${
            connected
              ? 'bg-success-bg/60 border-success-500/30 text-success-500'
              : 'bg-bg-elevated/60 border-bg-border text-ink-dim'
          }`}
        >
          <span className={connected ? 'dot-live' : 'dot bg-ink-dim/40'} />
          <span className="font-semibold">
            {connected ? t('dashboard.live') : t('dashboard.offline')}
          </span>
        </div>
      </div>

      {/* Actions urgentes */}
      {(effectivePending.kyc > 0 || effectivePending.withdrawals > 0) && (
        <div className="card p-5 border-warning-500/40 bg-gradient-to-br from-warning-bg/40 to-warning-bg/10 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-warning-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning-500/20 text-warning-500 flex items-center justify-center ring-1 ring-warning-500/30">
                <ShieldAlert size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-warning-500">
                  {t('dashboard.pending_actions')}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-ink-dim">
                  Action requise
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/kyc?status=PENDING"
                className="card-interactive p-4 flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs text-ink-muted">{t('nav.kyc')}</div>
                  <div className="text-2xl font-bold mt-0.5">
                    {effectivePending.kyc}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-ink-dim group-hover:text-brand-300 group-hover:translate-x-1 transition-all"
                />
              </Link>
              <Link
                to="/withdrawals?status=PENDING"
                className="card-interactive p-4 flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs text-ink-muted">
                    {t('nav.withdrawals')}
                  </div>
                  <div className="text-2xl font-bold mt-0.5">
                    {effectivePending.withdrawals}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-ink-dim group-hover:text-brand-300 group-hover:translate-x-1 transition-all"
                />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : data ? (
          <>
            <StatCard
              icon={Users}
              label={t('dashboard.users')}
              value={data.users.total.toLocaleString('fr-FR')}
              sub={t('dashboard.active_users', { n: data.users.active })}
              to="/users"
            />
            <StatCard
              icon={Store}
              label={t('dashboard.merchants')}
              value={data.merchants.total.toLocaleString('fr-FR')}
              sub={t('dashboard.verified_merchants', {
                n: data.merchants.verified,
              })}
              tone="success"
              to="/merchants"
            />
            <StatCard
              icon={TrendingUp}
              label={t('dashboard.tx_today')}
              value={data.transactions.today.count.toLocaleString('fr-FR')}
              sub={t('dashboard.tx_volume', {
                v: Number(data.transactions.today.volume).toLocaleString('fr-FR'),
              })}
              tone="cyan"
              to="/transactions"
            />
            <StatCard
              icon={Banknote}
              label={t('dashboard.revenue_month')}
              value={Number(data.revenueMonth.amount).toLocaleString('fr-FR')}
              sub={t('dashboard.revenue_count', {
                n: data.revenueMonth.count,
              })}
              tone="success"
              to="/fees"
            />
          </>
        ) : (
          <div className="col-span-full text-sm text-danger-400">
            {t('common.error')}
          </div>
        )}
      </div>

      {/* Graphes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume transactions 14j (area chart, 2/3 width) */}
        <div className="card p-5 lg:col-span-2 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/20 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold">
                    Volume des transactions
                  </div>
                  <div className="text-[11px] text-ink-dim">
                    14 derniers jours · succès uniquement
                  </div>
                </div>
              </div>
              {charts && charts.timeline.length > 0 && (
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-ink-dim">
                    Total période
                  </div>
                  <div className="text-base font-bold text-brand-300">
                    {charts.timeline
                      .reduce((s, b) => s + b.volume, 0)
                      .toLocaleString('fr-FR')}
                  </div>
                </div>
              )}
            </div>
            <div className="h-[260px]">
              {loading || !charts ? (
                <div className="skeleton w-full h-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts.timeline}
                    margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradVolume"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7c75f2"
                          stopOpacity={0.55}
                        />
                        <stop
                          offset="95%"
                          stopColor="#7c75f2"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gradCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22d3ee"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22d3ee"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtShortDate}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(148,163,184,0.15)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      name="Volume"
                      stroke="#7c75f2"
                      strokeWidth={2.5}
                      fill="url(#gradVolume)"
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Nombre"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      fill="url(#gradCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Donut — répartition par type */}
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/20 flex items-center justify-center">
                <PieIcon size={16} />
              </div>
              <div>
                <div className="text-sm font-bold">Répartition par type</div>
                <div className="text-[11px] text-ink-dim">30 derniers jours</div>
              </div>
            </div>
            <div className="h-[260px] flex items-center justify-center">
              {loading || !charts ? (
                <div className="skeleton w-40 h-40 rounded-full" />
              ) : charts.byType.length === 0 ? (
                <div className="text-sm text-ink-dim">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.byType}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {charts.byType.map((entry, i) => (
                        <Cell
                          key={entry.type}
                          fill={pickColor(entry.type, i)}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {charts && charts.byType.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {charts.byType.slice(0, 5).map((b, i) => (
                  <div
                    key={b.type}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: pickColor(b.type, i) }}
                      />
                      <span className="text-ink-muted truncate">{b.type}</span>
                    </div>
                    <span className="font-bold">{b.count.toLocaleString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Croissance utilisateurs */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-24 w-56 h-56 bg-success-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-success-bg text-success-500 ring-1 ring-success-500/20 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <div>
                <div className="text-sm font-bold">Croissance utilisateurs</div>
                <div className="text-[11px] text-ink-dim">
                  Cumulatif sur 14 jours
                </div>
              </div>
            </div>
            {charts && charts.usersGrowth.length > 0 && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-ink-dim">
                  Nouveaux (14j)
                </div>
                <div className="text-base font-bold text-success-500">
                  +
                  {(
                    charts.usersGrowth[charts.usersGrowth.length - 1].total -
                    charts.usersGrowth[0].total
                  ).toLocaleString('fr-FR')}
                </div>
              </div>
            )}
          </div>
          <div className="h-[180px]">
            {loading || !charts ? (
              <div className="skeleton w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.usersGrowth}
                  margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtShortDate}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(148,163,184,0.15)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Utilisateurs"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-400" />
              {t('dashboard.recent_tx')}
            </div>
            <div className="text-xs text-ink-muted mt-0.5">
              {t('dashboard.recent_tx_sub')}
            </div>
          </div>
          <Link
            to="/transactions"
            className="btn btn-sm btn-ghost text-xs"
          >
            Tout voir
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th className="text-right">Montant</th>
                <th>{t('common.status')}</th>
                <th>{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-32" /></td>
                    <td><div className="skeleton h-3 w-16" /></td>
                    <td><div className="skeleton h-3 w-20 ml-auto" /></td>
                    <td><div className="skeleton h-4 w-16" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                  </tr>
                ))
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <div className="text-3xl mb-2 opacity-30">📊</div>
                    <div className="text-sm text-ink-muted">
                      {t('common.empty')}
                    </div>
                  </td>
                </tr>
              ) : (
                recent.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono text-xs text-ink-muted">
                      {tx.reference}
                    </td>
                    <td>
                      <span className="badge-info">{tx.type}</span>
                    </td>
                    <td className="font-bold text-right">
                      {Number(tx.montant).toLocaleString('fr-FR')}
                      <span className="text-ink-muted ml-1 text-xs font-normal">
                        {tx.devise}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          tx.statut === 'SUCCESS'
                            ? 'badge-success'
                            : tx.statut === 'FAILED'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }
                      >
                        {tx.statut}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(tx.date).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
