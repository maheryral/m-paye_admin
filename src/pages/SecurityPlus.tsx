import { useEffect, useState } from 'react';
import {
  ShieldHalf,
  AlertTriangle,
  Smartphone,
  KeyRound,
  Trash2,
  Plus,
  Save,
} from 'lucide-react';
import { securityPlusApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

type Tab = 'failed' | 'devices' | '2fa';

export default function SecurityPlus() {
  const [tab, setTab] = useState<Tab>('failed');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={ShieldHalf}
        title="Security++"
        subtitle="Hardening avancé : logins échoués, devices bannis, 2FA forcée"
      />

      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {(
          [
            { id: 'failed', label: 'Logins échoués', icon: AlertTriangle },
            { id: 'devices', label: 'Devices bannis', icon: Smartphone },
            { id: '2fa', label: '2FA forcée', icon: KeyRound },
          ] as { id: Tab; label: string; icon: any }[]
        ).map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-brand text-white shadow-glow-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-bg-elevated/70'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'failed' && <FailedTab />}
      {tab === 'devices' && <DevicesTab />}
      {tab === '2fa' && <TwoFaTab />}
    </div>
  );
}

function FailedTab() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any>(null);

  async function load() {
    setData(await securityPlusApi.failedLogins(days));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (!data) return <div className="text-sm text-ink-muted">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-dim">
              Échecs sur la période
            </div>
            <div className="text-3xl font-bold text-danger-400 mt-1">
              {data.total}
            </div>
          </div>
          <select
            className="input w-auto"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={1}>24h</option>
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <div className="card overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-bg-border">
            <div className="text-sm font-bold">Top 20 IPs offensantes</div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>IP</th>
                  <th>Échecs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.topIps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-ink-muted">
                      Aucune
                    </td>
                  </tr>
                ) : (
                  data.topIps.map((r: any) => (
                    <tr key={r.ip}>
                      <td className="font-mono text-xs whitespace-nowrap">{r.ip}</td>
                      <td className="font-bold text-danger-400">{r.count}</td>
                      <td>
                        <a
                          href="/security"
                          className="text-brand-300 text-xs hover:underline whitespace-nowrap"
                        >
                          Bloquer →
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-bg-border">
            <div className="text-sm font-bold">Top 20 comptes ciblés</div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Échecs</th>
                </tr>
              </thead>
              <tbody>
                {data.topUsers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-6 text-ink-muted">
                      Aucun
                    </td>
                  </tr>
                ) : (
                  data.topUsers.map((u: any) => (
                    <tr key={u.userId}>
                      <td>
                        {u.user ? (
                          <div className="min-w-0">
                            <div className="font-semibold truncate max-w-[220px]">
                              {u.user.prenom} {u.user.nom}
                            </div>
                            <div className="text-xs text-ink-muted truncate max-w-[220px]">
                              {u.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-xs">{u.userId}</span>
                        )}
                      </td>
                      <td className="font-bold text-danger-400">{u.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-bg-border">
          <div className="text-sm font-bold">50 dernières tentatives</div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>IP</th>
                <th>User Agent</th>
                <th>Raison</th>
                <th>Suspect</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((l: any) => (
                <tr key={l.id}>
                  <td className="text-xs text-ink-muted whitespace-nowrap">
                    {new Date(l.loginAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="font-mono text-xs whitespace-nowrap">{l.ipAddress ?? '—'}</td>
                  <td className="text-xs text-ink-muted">
                    {/* span block requis : truncate ne fonctionne pas sur <td> sans table-fixed */}
                    <span
                      className="block max-w-[260px] truncate"
                      title={l.userAgent ?? ''}
                    >
                      {l.userAgent ?? '—'}
                    </span>
                  </td>
                  <td className="text-xs">
                    <span className="block max-w-[180px] truncate" title={l.failureReason ?? ''}>
                      {l.failureReason ?? '—'}
                    </span>
                  </td>
                  <td>
                    {l.isSuspicious ? (
                      <span className="badge-danger">SUSPECT</span>
                    ) : (
                      <span className="text-ink-dim text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-ink-muted">
                    Aucune tentative
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DevicesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ deviceId: '', reason: '' });

  async function load() {
    const list = await securityPlusApi.listDevices({ q: q || undefined });
    setItems(list.items);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function block(e: React.FormEvent) {
    e.preventDefault();
    await securityPlusApi.blockDevice(form.deviceId, form.reason);
    setShow(false);
    setForm({ deviceId: '', reason: '' });
    load();
  }

  async function unblock(id: string) {
    if (!confirm('Débloquer ce device ?')) return;
    await securityPlusApi.unblockDevice(id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Rechercher un device-id ou motif…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-danger"
        >
          <Plus size={14} /> Bloquer un device
        </button>
      </div>

      {show && (
        <form onSubmit={block} className="card p-5 mb-4 space-y-3">
          <div>
            <label className="label">Device ID (X-Device-Id)</label>
            <input
              className="input font-mono"
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
              placeholder="web-admin-abc123-…"
              required
            />
          </div>
          <div>
            <label className="label">Motif</label>
            <textarea
              className="input min-h-[80px]"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex: appareil compromis, fraude détectée"
              required
            />
          </div>
          <button type="submit" className="btn btn-md btn-danger">
            <Save size={14} /> Bloquer (révoque sessions actives)
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Motif</th>
                <th>Bloqué le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="font-mono text-xs">
                    <span
                      className="block max-w-[240px] truncate"
                      title={d.deviceId}
                    >
                      {d.deviceId}
                    </span>
                  </td>
                  <td className="text-ink-muted">
                    <span
                      className="block max-w-[320px] truncate"
                      title={d.reason}
                    >
                      {d.reason}
                    </span>
                  </td>
                  <td className="text-ink-muted text-xs whitespace-nowrap">
                    {new Date(d.blockedAt).toLocaleString('fr-FR')}
                  </td>
                  <td>
                    <button
                      onClick={() => unblock(d.id)}
                      className="btn btn-sm btn-ghost text-danger-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-ink-muted">
                    Aucun device bloqué
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TwoFaTab() {
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [rolesInput, setRolesInput] = useState('');
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [s, st] = await Promise.all([
      securityPlusApi.get2fa(),
      securityPlusApi.twofaStats(),
    ]);
    setSettings(s);
    setStats(st);
    setRequired(!!s.twoFactorRequired);
    setRolesInput(
      Array.isArray(s.twoFactorEnforcedForRoles)
        ? s.twoFactorEnforcedForRoles.join(',')
        : '',
    );
  }

  useEffect(() => {
    load();
  }, []);

  if (!settings) return <div className="text-sm text-ink-muted">Chargement…</div>;

  async function save() {
    setBusy(true);
    try {
      const roles = rolesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await securityPlusApi.set2fa({
        twoFactorRequired: required,
        twoFactorEnforcedForRoles: roles,
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-dim">
            Avec 2FA active
          </div>
          <div className="text-3xl font-bold text-success-500 mt-1">
            {stats?.withTfa ?? 0}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-dim">
            Sans 2FA (actifs)
          </div>
          <div className="text-3xl font-bold text-warning-500 mt-1">
            {stats?.withoutTfa ?? 0}
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="text-sm font-bold">Politique d'enforcement</div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Forcer la 2FA pour <span className="font-bold">tous</span> les
          utilisateurs
        </label>

        <div>
          <label className="label">
            Forcer la 2FA pour des rôles spécifiques (CSV)
          </label>
          <input
            className="input"
            value={rolesInput}
            onChange={(e) => setRolesInput(e.target.value)}
            placeholder="ADMIN,SUPER_ADMIN"
          />
          <div className="text-[10px] text-ink-dim mt-1">
            Sans effet si "Forcer pour tous" est activé.
          </div>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="btn btn-md btn-primary"
        >
          <Save size={14} />
          {busy ? 'Envoi…' : 'Enregistrer la politique'}
        </button>
      </div>

      <div className="card p-4 text-xs text-ink-muted">
        ℹ️ Les guards backend doivent vérifier ces réglages au login pour
        refuser l'accès aux utilisateurs concernés tant qu'ils n'ont pas
        activé leur 2FA.
      </div>
    </div>
  );
}
