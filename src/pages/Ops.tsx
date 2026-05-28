import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Construction,
  Smartphone,
  Save,
  Trash2,
} from 'lucide-react';
import { opsApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

type Tab = 'health' | 'maintenance' | 'versions';

export default function Ops() {
  const [tab, setTab] = useState<Tab>('health');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Activity}
        title="Opérations & DevOps"
        subtitle="Santé du système, mode maintenance, versions mobile"
      />

      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {(
          [
            { id: 'health', label: 'Santé', icon: Activity },
            { id: 'maintenance', label: 'Maintenance', icon: Construction },
            { id: 'versions', label: 'Versions mobile', icon: Smartphone },
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

      {tab === 'health' && <HealthTab />}
      {tab === 'maintenance' && <MaintenanceTab />}
      {tab === 'versions' && <VersionsTab />}
    </div>
  );
}

// ============================================================
// Tab 1: Health
// ============================================================
function HealthTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await opsApi.health();
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000); // refresh 15s
    return () => clearInterval(t);
  }, []);

  if (loading && !data) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div
        className={`card p-4 flex items-center justify-between ${
          data.ok
            ? 'border-success-500/30 bg-success-bg/30'
            : 'border-danger-500/30 bg-danger-bg/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {data.ok ? (
            <CheckCircle2 size={24} className="text-success-500" />
          ) : (
            <AlertCircle size={24} className="text-danger-400" />
          )}
          <div>
            <div className="text-lg font-bold">
              {data.ok ? 'Système opérationnel' : 'Anomalie détectée'}
            </div>
            <div className="text-xs text-ink-muted">
              Dernière vérif : {new Date(data.at).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
        <button onClick={load} className="btn btn-sm btn-secondary">
          Rafraîchir
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(data.checks).map(([key, check]: [string, any]) => (
          <div key={key} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold capitalize">{key}</div>
              {check.ok ? (
                <CheckCircle2 size={16} className="text-success-500" />
              ) : (
                <AlertCircle size={16} className="text-danger-400" />
              )}
            </div>
            {check.latencyMs !== undefined && (
              <div className="text-xs text-ink-muted">
                Latence : {check.latencyMs}ms
              </div>
            )}
            {check.info && (
              <pre className="text-[10px] mt-2 font-mono text-ink-muted whitespace-pre-wrap">
                {typeof check.info === 'object'
                  ? JSON.stringify(check.info, null, 2)
                  : String(check.info)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Maintenance mode
// ============================================================
function MaintenanceTab() {
  const [state, setState] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setState(await opsApi.getMaintenance());
  }

  useEffect(() => {
    load();
  }, []);

  if (!state) return <div className="text-sm text-ink-muted">Chargement…</div>;

  async function toggle() {
    setBusy(true);
    try {
      const next = !state.enabled;
      if (
        next &&
        !confirm(
          'Activer le mode maintenance ? Les users non-admin seront déconnectés / bloqués.',
        )
      )
        return;
      await opsApi.setMaintenance({
        enabled: next,
        message: state.message,
        bypassRoles: state.bypassRoles,
        startsAt: state.startsAt,
        endsAt: state.endsAt,
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await opsApi.setMaintenance({
        enabled: state.enabled,
        message: state.message,
        bypassRoles: state.bypassRoles,
        startsAt: state.startsAt,
        endsAt: state.endsAt,
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card p-6 space-y-4">
      <div
        className={`flex items-center justify-between p-4 rounded-xl ${
          state.enabled ? 'bg-danger-bg' : 'bg-success-bg'
        }`}
      >
        <div className="flex items-center gap-3">
          <Construction
            size={24}
            className={state.enabled ? 'text-danger-400' : 'text-success-500'}
          />
          <div>
            <div className="text-base font-bold">
              {state.enabled ? 'MAINTENANCE ACTIVE' : 'Service opérationnel'}
            </div>
            <div className="text-xs text-ink-muted">
              Bypass : {state.bypassRoles || '—'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`btn btn-md ${state.enabled ? 'btn-success' : 'btn-danger'}`}
        >
          {state.enabled ? 'Désactiver' : 'Activer maintenance'}
        </button>
      </div>

      <div>
        <label className="label">Message affiché aux users</label>
        <textarea
          className="input min-h-[100px]"
          value={state.message ?? ''}
          onChange={(e) => setState({ ...state, message: e.target.value })}
          placeholder="Ex: Maintenance prévue. Service indisponible jusqu'à 22h."
        />
      </div>

      <div>
        <label className="label">Rôles autorisés à bypasser (CSV)</label>
        <input
          className="input"
          value={state.bypassRoles ?? ''}
          onChange={(e) => setState({ ...state, bypassRoles: e.target.value })}
          placeholder="ADMIN,SUPER_ADMIN"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Démarre le</label>
          <input
            type="datetime-local"
            className="input"
            value={state.startsAt?.slice(0, 16) ?? ''}
            onChange={(e) => setState({ ...state, startsAt: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Termine le</label>
          <input
            type="datetime-local"
            className="input"
            value={state.endsAt?.slice(0, 16) ?? ''}
            onChange={(e) => setState({ ...state, endsAt: e.target.value })}
          />
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn btn-md btn-primary">
        <Save size={14} /> Enregistrer
      </button>
    </form>
  );
}

// ============================================================
// Tab 3: App versions (mobile force update)
// ============================================================
function VersionsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    platform: 'IOS',
    minVersion: '',
    latestVersion: '',
    forceUpdate: false,
    message: '',
    storeUrl: '',
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    setItems(await opsApi.listVersions());
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await opsApi.upsertVersion(form);
      setForm({
        platform: 'IOS',
        minVersion: '',
        latestVersion: '',
        forceUpdate: false,
        message: '',
        storeUrl: '',
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(platform: string) {
    if (!confirm(`Supprimer la config ${platform} ?`)) return;
    await opsApi.removeVersion(platform);
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="card p-5 space-y-3">
        <div className="text-sm font-bold">
          Configurer une plateforme (upsert)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Plateforme</label>
            <select
              className="input"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            >
              <option value="IOS">iOS</option>
              <option value="ANDROID">Android</option>
              <option value="WEB">Web</option>
            </select>
          </div>
          <div>
            <label className="label">Version min</label>
            <input
              className="input"
              value={form.minVersion}
              onChange={(e) => setForm({ ...form, minVersion: e.target.value })}
              placeholder="1.0.0"
              required
            />
          </div>
          <div>
            <label className="label">Dernière version</label>
            <input
              className="input"
              value={form.latestVersion}
              onChange={(e) =>
                setForm({ ...form, latestVersion: e.target.value })
              }
              placeholder="1.2.3"
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Message</label>
          <input
            className="input"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Mise à jour critique requise"
          />
        </div>
        <div>
          <label className="label">URL Store</label>
          <input
            className="input"
            value={form.storeUrl}
            onChange={(e) => setForm({ ...form, storeUrl: e.target.value })}
            placeholder="https://apps.apple.com/…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.forceUpdate}
            onChange={(e) =>
              setForm({ ...form, forceUpdate: e.target.checked })
            }
          />
          Force update (l'app refuse de démarrer en dessous de minVersion)
        </label>
        <button type="submit" disabled={busy} className="btn btn-md btn-primary">
          <Save size={14} /> Enregistrer
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Plateforme</th>
              <th>Min</th>
              <th>Dernière</th>
              <th>Force update</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucune plateforme configurée
                </td>
              </tr>
            ) : (
              items.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span className="badge-info">{v.platform}</span>
                  </td>
                  <td className="font-mono">{v.minVersion}</td>
                  <td className="font-mono">{v.latestVersion}</td>
                  <td>
                    <span
                      className={v.forceUpdate ? 'badge-danger' : 'badge-success'}
                    >
                      {v.forceUpdate ? 'OUI' : 'NON'}
                    </span>
                  </td>
                  <td className="text-ink-muted text-xs max-w-xs truncate">
                    {v.message || '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => remove(v.platform)}
                      className="btn btn-sm btn-ghost text-danger-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
