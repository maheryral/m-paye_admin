import { useEffect, useState } from 'react';
import {
  ShieldOff,
  Plus,
  Trash2,
  Search,
  Ban,
  ShieldAlert,
  Clock,
  Globe,
} from 'lucide-react';
import { ipBlacklistApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface IpEntry {
  id: string;
  ipAddress: string;
  reason: string;
  isPermanent: boolean;
  blockedAt: string;
  expiresAt?: string | null;
}

export default function Security() {
  const [items, setItems] = useState<IpEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ipAddress: '',
    reason: '',
    isPermanent: false,
    expiresAt: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        ipBlacklistApi.list({ page: 1, limit: 100, q: q || undefined }),
        ipBlacklistApi.stats(),
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
  }, [q]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await ipBlacklistApi.create({
        ipAddress: form.ipAddress.trim(),
        reason: form.reason.trim(),
        isPermanent: form.isPermanent,
        expiresAt: form.expiresAt || undefined,
      });
      setForm({ ipAddress: '', reason: '', isPermanent: false, expiresAt: '' });
      setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: IpEntry) {
    if (!confirm(`Débloquer l'IP ${entry.ipAddress} ?`)) return;
    await ipBlacklistApi.remove(entry.id);
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={ShieldOff}
        title="Sécurité — Blacklist IP"
        subtitle="Blocage des adresses IP suspectes"
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-md btn-primary"
          >
            <Plus size={14} /> {showForm ? 'Fermer' : 'Bloquer une IP'}
          </button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill icon={Globe} label="Total" value={stats.total} tone="brand" />
          <StatPill icon={Ban} label="Actives" value={stats.active} tone="danger" />
          <StatPill icon={ShieldAlert} label="Permanentes" value={stats.permanent} tone="warning" />
          <StatPill icon={Clock} label="Expirées" value={stats.expired} tone="brand" />
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Adresse IP (v4 ou v6)</label>
              <input
                className="input font-mono"
                value={form.ipAddress}
                onChange={(e) =>
                  setForm({ ...form, ipAddress: e.target.value })
                }
                placeholder="192.168.1.42"
                required
              />
            </div>
            <div>
              <label className="label">Expire le (optionnel)</label>
              <input
                type="datetime-local"
                className="input"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                disabled={form.isPermanent}
              />
            </div>
          </div>
          <div>
            <label className="label">Motif</label>
            <input
              className="input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex: tentative de bruteforce répétée"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPermanent}
              onChange={(e) =>
                setForm({ ...form, isPermanent: e.target.checked })
              }
            />
            Blocage permanent
          </label>
          {err && (
            <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn btn-md btn-danger"
          >
            {busy ? 'Envoi…' : 'Bloquer cette IP'}
          </button>
        </form>
      )}

      <div className="card p-3 mb-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <input
            className="input pl-9"
            placeholder="Rechercher une IP ou un motif…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Adresse IP</th>
                <th>Motif</th>
                <th>Type</th>
                <th>Bloquée le</th>
                <th>Expire</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-28" /></td>
                    <td><div className="skeleton h-3 w-40" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-10" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ShieldOff}
                      title="Aucune IP blacklistée"
                      description="Aucune adresse IP n'est actuellement bloquée."
                    />
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono">{i.ipAddress}</td>
                    <td className="text-ink-muted">{i.reason}</td>
                    <td>
                      <span
                        className={i.isPermanent ? 'badge-danger' : 'badge-warning'}
                      >
                        {i.isPermanent ? 'PERMANENT' : 'TEMPORAIRE'}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(i.blockedAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-ink-muted text-xs">
                      {i.expiresAt
                        ? new Date(i.expiresAt).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => remove(i)}
                        className="btn btn-sm btn-ghost text-danger-400 hover:text-danger-500"
                        title="Débloquer"
                      >
                        <Trash2 size={14} />
                      </button>
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

