import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Banknote,
  Percent,
  LogOut,
  Shield,
  ArrowLeftRight,
  Undo2,
  Users,
  Store,
  Megaphone,
  Download,
  ShieldOff,
  Coins,
  CreditCard,
  MessagesSquare,
  Snowflake,
  FileClock,
  ShieldAlert,
  Activity,
  Bus,
  Sparkles,
  LifeBuoy,
  ShieldHalf,
  KeyRound,
  GraduationCap,
  Palette,
  Wallet,
  Bell,
  MessageCircle,
  CableCar,
  Car,
  ChevronDown,
  Tag,
  AppWindow,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useAdminSocket } from '../contexts/AdminSocketContext';
import { LOCALES, type Locale } from '../i18n/locales';

type Badge = 'kyc' | 'merchants' | 'refunds' | 'withdrawals' | 'reclamations';

interface NavLeaf {
  to: string;
  i18n: string;
  icon: any;
  end?: boolean;
  badge?: Badge;
  perms?: string[]; // any-match. Vide / absent = visible pour tout admin connecté
  superOnly?: boolean; // visible uniquement pour SUPER_ADMIN
}

interface NavGroupDef {
  group: string; // identifiant unique du groupe
  i18n: string;
  icon: any;
  perms?: string[];
  superOnly?: boolean;
  children: NavLeaf[];
}

type NavItem = { section: string } | NavLeaf | NavGroupDef;

const NAV: NavItem[] = [
  {
    to: '/',
    i18n: 'nav.overview',
    icon: LayoutDashboard,
    end: true,
    perms: ['dashboard:view'],
  },
  { section: 'nav.section.regulation' },
  {
    to: '/kyc',
    i18n: 'nav.kyc',
    icon: ShieldCheck,
    badge: 'kyc',
    perms: ['kyc:list', 'kyc:approve', 'kyc:reject'],
  },
  {
    to: '/merchants',
    i18n: 'nav.merchants',
    icon: Store,
    badge: 'merchants',
    perms: [
      'merchants:list',
      'merchants:approve',
      'merchants:reject',
      'merchants:suspend',
    ],
  },
  { section: 'nav.section.financial' },
  {
    to: '/transactions',
    i18n: 'nav.transactions',
    icon: ArrowLeftRight,
    perms: ['transactions:list', 'transactions:view'],
  },
  {
    to: '/refunds',
    i18n: 'nav.refunds',
    icon: Undo2,
    badge: 'refunds',
    perms: ['refunds:list', 'refunds:approve', 'refunds:reject'],
  },
  {
    to: '/withdrawals',
    i18n: 'nav.withdrawals',
    icon: Banknote,
    badge: 'withdrawals',
    perms: ['withdrawals:list', 'withdrawals:approve', 'withdrawals:reject'],
  },
  {
    to: '/payment-requests',
    i18n: 'nav.paymentRequests',
    icon: Wallet,
    perms: ['withdrawals:list', 'withdrawals:approve'],
  },
  {
    to: '/wallets',
    i18n: 'nav.wallets',
    icon: Snowflake,
    perms: ['wallets:list', 'wallets:freeze', 'wallets:unfreeze'],
  },
  {
    to: '/fees',
    i18n: 'nav.fees',
    icon: Percent,
    perms: ['fees:read', 'fees:write'],
  },
  {
    to: '/fx-rates',
    i18n: 'nav.fxrates',
    icon: Coins,
    perms: ['fx-rates:read', 'fx-rates:write'],
  },
  {
    to: '/payment-providers',
    i18n: 'nav.paymentProviders',
    icon: CreditCard,
    superOnly: true,
  },
  {
    to: '/service-types',
    i18n: 'nav.serviceTypes',
    icon: Tag,
    perms: ['service-types:list', 'service-types:manage'],
  },
  {
    to: '/billers',
    i18n: 'nav.billers',
    icon: AppWindow,
    perms: ['billers:list', 'billers:manage'],
  },
  {
    to: '/partners',
    i18n: 'nav.partners',
    icon: KeyRound,
    perms: ['partners:list', 'partners:manage'],
  },
  {
    to: '/transport-scolaire/schools',
    i18n: 'nav.transportScolaire',
    icon: GraduationCap,
    perms: ['transport-scolaire:read', 'transport-scolaire:write'],
  },
  {
    to: '/vehicle-rentals',
    i18n: 'nav.vehicleRentals',
    icon: Car,
    perms: ['vehicle-rentals:read', 'vehicle-rentals:write'],
  },
  {
    to: '/app-theme',
    i18n: 'nav.appTheme',
    icon: Palette,
    perms: ['app-theme:read', 'app-theme:write'],
  },
  { section: 'nav.section.community' },
  {
    to: '/users',
    i18n: 'nav.users',
    icon: Users,
    perms: ['users:list', 'users:view'],
  },
  {
    to: '/reclamations',
    i18n: 'nav.reclamations',
    icon: MessagesSquare,
    badge: 'reclamations',
    perms: ['reclamations:list', 'reclamations:respond'],
  },
  {
    to: '/messages',
    i18n: 'nav.messages',
    icon: MessageCircle,
    perms: ['communications:tickets'],
  },
  {
    group: 'transport',
    i18n: 'nav.transport',
    icon: Bus,
    perms: ['transport:read', 'transport:write'],
    children: [
      {
        to: '/transport',
        i18n: 'nav.transport.taxibrousse',
        icon: Bus,
        end: true,
        perms: ['transport:read', 'transport:write'],
      },
      {
        to: '/transport/telepherique',
        i18n: 'nav.transport.telepherique',
        icon: CableCar,
        perms: ['transport:read', 'transport:write'],
      },
    ],
  },
  {
    to: '/marketing',
    i18n: 'nav.marketing',
    icon: Sparkles,
    perms: [
      'marketing:flags',
      'marketing:coupons',
      'marketing:referrals',
      'marketing:loyalty',
    ],
  },
  {
    to: '/comms',
    i18n: 'nav.comms',
    icon: LifeBuoy,
    perms: ['communications:tickets', 'communications:templates'],
  },
  {
    to: '/broadcast',
    i18n: 'nav.broadcast',
    icon: Megaphone,
    perms: ['communications:broadcast'],
  },
  { section: 'nav.section.system' },
  {
    to: '/compliance',
    i18n: 'nav.compliance',
    icon: ShieldAlert,
    perms: [
      'compliance:risk',
      'compliance:velocity',
      'compliance:sanctions',
      'compliance:activities',
      'compliance:reports',
    ],
  },
  {
    to: '/ops',
    i18n: 'nav.ops',
    icon: Activity,
    perms: ['ops:health', 'ops:maintenance', 'ops:versions'],
  },
  {
    to: '/security',
    i18n: 'nav.security',
    icon: ShieldOff,
    perms: ['security:ip-blacklist'],
  },
  {
    to: '/security-plus',
    i18n: 'nav.securityPlus',
    icon: ShieldHalf,
    perms: ['security:device-blacklist', 'security:logs'],
  },
  // 2FA personnel : tout admin connecté
  { to: '/my-2fa', i18n: 'nav.my2fa', icon: KeyRound },
  // Gestion des admins : SUPER_ADMIN uniquement
  { to: '/admins', i18n: 'nav.admins', icon: Shield, superOnly: true },
  {
    to: '/audit',
    i18n: 'nav.audit',
    icon: FileClock,
    perms: ['audit:read'],
  },
  {
    to: '/exports',
    i18n: 'nav.exports',
    icon: Download,
    perms: ['exports:users', 'exports:transactions', 'exports:revenue'],
  },
];

// Groupe de navigation pliable (ex: Transport → Taxi-brousse, Téléphérique)
function NavGroup({
  group,
  t,
}: {
  group: NavGroupDef;
  t: (key: string) => string;
}) {
  const location = useLocation();
  const Icon = group.icon;
  // Actif si l'URL courante correspond à un des enfants
  const isChildActive = group.children.some((c) =>
    c.end ? location.pathname === c.to : location.pathname.startsWith(c.to),
  );
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`nav-item w-full ${isChildActive ? 'text-ink' : ''}`}
      >
        <Icon size={17} strokeWidth={2} />
        <span className="flex-1 truncate text-left">{t(group.i18n)}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-bg-border/60 space-y-0.5">
          {group.children.map((c) => {
            const CIcon = c.icon;
            return (
              <NavLink
                key={c.to}
                to={c.to}
                end={c.end}
                className={({ isActive }) =>
                  `nav-item text-sm ${isActive ? 'nav-item-active' : ''}`
                }
              >
                {CIcon && <CIcon size={15} strokeWidth={2} />}
                <span className="flex-1 truncate">{t(c.i18n)}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout, can } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const { connected, pending } = useAdminSocket();
  const navigate = useNavigate();

  // Filtre les items selon les permissions de l'admin connecté,
  // puis supprime les sections devenues vides.
  const visibleNav = (() => {
    const isSuper = user?.role === 'SUPER_ADMIN';
    const canSee = (it: { perms?: string[]; superOnly?: boolean }) => {
      if (it.superOnly && !isSuper) return false;
      if (!it.perms || it.perms.length === 0) return true;
      return can(it.perms);
    };

    const filtered: NavItem[] = [];
    for (const item of NAV) {
      if ('section' in item) {
        filtered.push(item);
        continue;
      }
      if ('group' in item) {
        if (!canSee(item)) continue;
        const children = item.children.filter(canSee);
        if (children.length === 0) continue;
        filtered.push({ ...item, children });
        continue;
      }
      if (canSee(item)) filtered.push(item);
    }

    // Drop des sections orphelines
    const out: NavItem[] = [];
    for (let i = 0; i < filtered.length; i++) {
      const it = filtered[i];
      if ('section' in it) {
        const next = filtered[i + 1];
        if (!next || 'section' in next) continue;
      }
      out.push(it);
    }
    return out;
  })();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const totalPending = pending
    ? pending.kyc +
      pending.merchants +
      pending.refunds +
      pending.withdrawals +
      pending.reclamations
    : 0;

  const roleLabel =
    user?.role === 'SUPER_ADMIN'
      ? 'Super-admin'
      : user?.role === 'ADMIN'
      ? 'Administrateur'
      : user?.role || '';

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-64 shrink-0 h-screen border-r border-bg-border/60 bg-bg-surface/60 backdrop-blur-md flex flex-col">
        {/* Header logo + statut live (immobile) */}
        <div className="shrink-0 px-5 py-5 border-b border-bg-border/60">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-md opacity-50" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-soft">
                <Shield size={18} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold tracking-tight">
                M'Paye <span className="text-brand-300">Admin</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-dim">
                <span
                  className={connected ? 'dot-live' : 'dot bg-ink-dim/40'}
                  title={connected ? t('dashboard.live') : t('dashboard.offline')}
                />
                {connected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item, i) => {
            if ('section' in item) {
              return (
                <div
                  key={`s-${i}`}
                  className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-dim"
                >
                  {t(item.section)}
                </div>
              );
            }
            if ('group' in item) {
              return <NavGroup key={item.group} group={item} t={t} />;
            }
            const { to, i18n, icon: Icon, end, badge } = item;
            const count = badge && pending ? pending[badge] : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <Icon size={17} strokeWidth={2} />
                <span className="flex-1 truncate">{t(i18n)}</span>
                {count > 0 && (
                  <span className="bg-danger-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-bg-base/70 border-b border-bg-border/60 px-6 lg:px-8 py-3 flex items-center justify-end gap-3">
          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate('/audit')}
            className="relative p-2.5 rounded-xl bg-bg-elevated/40 border border-bg-border/60 hover:bg-bg-elevated/80 transition-all"
            title={t('nav.audit')}
          >
            <Bell size={16} className="text-ink-muted" />
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
                {totalPending > 99 ? '99+' : totalPending}
              </span>
            )}
          </button>

          {/* Language switcher */}
          <div className="flex gap-0.5 p-1 bg-bg-elevated/40 rounded-xl border border-bg-border/60">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code as Locale)}
                className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${
                  locale === l.code
                    ? 'bg-gradient-brand text-white shadow-glow-soft'
                    : 'text-ink-muted hover:text-ink hover:bg-bg-subtle'
                }`}
                title={l.label}
              >
                <span>{l.flag}</span>{' '}
                <span className="uppercase font-bold">{l.code}</span>
              </button>
            ))}
          </div>

          {/* User profile + logout */}
          <div className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-bg-elevated/40 border border-bg-border/60">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow-soft">
              {(user?.prenom?.[0] ?? '?').toUpperCase()}
              {(user?.nom?.[0] ?? '').toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight pr-1 hidden sm:block">
              <div className="text-xs font-semibold truncate">
                {user?.prenom} {user?.nom}
              </div>
              <div className="text-[10px] text-ink-dim truncate">
                {roleLabel}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-ink-muted hover:text-danger-400 hover:bg-danger-500/10 transition-all"
              title={t('nav.logout')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
