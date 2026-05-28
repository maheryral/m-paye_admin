import { useEffect, useState } from 'react';
import {
  Megaphone,
  ToggleLeft,
  ToggleRight,
  Tags,
  Users2,
  Gift,
  Trash2,
  Save,
  Plus,
} from 'lucide-react';
import { marketingApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

type Tab = 'flags' | 'coupons' | 'referrals' | 'loyalty';

export default function Marketing() {
  const [tab, setTab] = useState<Tab>('flags');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Marketing & Croissance"
        subtitle="Feature flags, coupons, parrainage, fidélité"
      />

      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {(
          [
            { id: 'flags', label: 'Feature flags', icon: ToggleRight },
            { id: 'coupons', label: 'Analytics coupons', icon: Tags },
            { id: 'referrals', label: 'Parrainage', icon: Users2 },
            { id: 'loyalty', label: 'Fidélité', icon: Gift },
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

      {tab === 'flags' && <FlagsTab />}
      {tab === 'coupons' && <CouponsTab />}
      {tab === 'referrals' && <ReferralsTab />}
      {tab === 'loyalty' && <LoyaltyTab />}
    </div>
  );
}

function FlagsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    code: '',
    label: '',
    description: '',
    enabled: false,
    rolloutPercent: 100,
    audience: '',
  });

  async function load() {
    setItems(await marketingApi.listFlags());
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await marketingApi.upsertFlag(form);
    setShow(false);
    setForm({
      code: '',
      label: '',
      description: '',
      enabled: false,
      rolloutPercent: 100,
      audience: '',
    });
    load();
  }

  async function toggle(flag: any) {
    await marketingApi.upsertFlag({
      code: flag.code,
      label: flag.label,
      description: flag.description,
      enabled: !flag.enabled,
      rolloutPercent: flag.rolloutPercent,
      audience: flag.audience,
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce flag ?')) return;
    await marketingApi.deleteFlag(id);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouveau flag
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Code (kebab-case)</label>
              <input
                className="input font-mono"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="new_qr_flow"
                required
              />
            </div>
            <div>
              <label className="label">Libellé</label>
              <input
                className="input"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Rollout %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                value={form.rolloutPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rolloutPercent: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="label">Audience (CSV rôles ou "ALL")</label>
              <input
                className="input"
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="ALL ou USER,ADMIN"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm({ ...form, enabled: e.target.checked })
              }
            />
            Activé par défaut
          </label>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Créer / Mettre à jour
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Libellé</th>
              <th>Rollout</th>
              <th>Audience</th>
              <th>État</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id}>
                <td className="font-mono text-xs">{f.code}</td>
                <td>
                  <div className="font-semibold">{f.label}</div>
                  {f.description && (
                    <div className="text-xs text-ink-muted max-w-md truncate">
                      {f.description}
                    </div>
                  )}
                </td>
                <td>{f.rolloutPercent}%</td>
                <td className="text-xs">{f.audience || 'ALL'}</td>
                <td>
                  <button
                    onClick={() => toggle(f)}
                    className={f.enabled ? 'text-success-500' : 'text-ink-dim'}
                  >
                    {f.enabled ? (
                      <ToggleRight size={28} />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => remove(f.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucun flag
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CouponsTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    marketingApi.couponAnalytics().then(setItems);
  }, []);

  const totalDiscount = items.reduce(
    (s, i) => s + Number(i.totalDiscount || 0),
    0,
  );
  const totalOriginal = items.reduce(
    (s, i) => s + Number(i.totalOriginal || 0),
    0,
  );
  const roi = totalOriginal > 0 ? (totalOriginal - totalDiscount) / totalOriginal : 0;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-dim">
            Discount total
          </div>
          <div className="text-2xl font-bold mt-1 text-danger-400">
            -{totalDiscount.toLocaleString('fr-FR')}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-dim">
            CA généré (avant remise)
          </div>
          <div className="text-2xl font-bold mt-1 text-success-500">
            {totalOriginal.toLocaleString('fr-FR')}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-dim">
            ROI net
          </div>
          <div className="text-2xl font-bold mt-1">
            {(roi * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Marchand</th>
              <th>Utilisations</th>
              <th>Discount total</th>
              <th>CA généré</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.code}</td>
                <td>{c.name}</td>
                <td className="text-ink-muted">{c.merchant ?? '—'}</td>
                <td>
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                </td>
                <td className="text-danger-400">
                  -{Number(c.totalDiscount).toLocaleString('fr-FR')}
                </td>
                <td className="text-success-500">
                  {Number(c.totalOriginal).toLocaleString('fr-FR')}
                </td>
                <td>
                  <span
                    className={
                      c.status === 'ACTIVE'
                        ? 'badge-success'
                        : c.status === 'EXPIRED' || c.status === 'EXHAUSTED'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-ink-muted">
                  Aucun coupon
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReferralsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState('');

  async function load() {
    const [list, s] = await Promise.all([
      marketingApi.listReferrals({ status: status || undefined }),
      marketingApi.referralStats(),
    ]);
    setItems(list.items);
    setStats(s);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div className="card p-3">
          <div className="text-[10px] text-ink-dim">Pending</div>
          <div className="text-xl font-bold">{stats?.pending ?? 0}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-ink-dim">Completed</div>
          <div className="text-xl font-bold">{stats?.completed ?? 0}</div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-ink-dim">Rewarded</div>
          <div className="text-xl font-bold text-success-500">
            {stats?.rewarded ?? 0}
          </div>
        </div>
        <div className="card p-3">
          <div className="text-[10px] text-ink-dim">Expired</div>
          <div className="text-xl font-bold text-danger-400">
            {stats?.expired ?? 0}
          </div>
        </div>
        <div className="card p-3 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-ink-dim">Total versé</div>
          <div className="text-lg font-bold">
            {Number(stats?.totalReward ?? 0).toLocaleString('fr-FR')}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'PENDING', 'COMPLETED', 'REWARDED', 'EXPIRED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s || 'Tous'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Parrain</th>
              <th>Filleul</th>
              <th>Statut</th>
              <th>Reward</th>
              <th>Créé</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td className="font-mono">{r.code}</td>
                <td>
                  {r.referrer
                    ? `${r.referrer.prenom} ${r.referrer.nom}`
                    : <span className="text-ink-dim">{r.referrerId}</span>}
                </td>
                <td>
                  {r.referred
                    ? `${r.referred.prenom} ${r.referred.nom}`
                    : <span className="text-ink-dim">—</span>}
                </td>
                <td>
                  <span
                    className={
                      r.status === 'REWARDED'
                        ? 'badge-success'
                        : r.status === 'EXPIRED'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.rewardAmount
                    ? `${Number(r.rewardAmount).toLocaleString('fr-FR')} ${r.rewardCurrency}`
                    : '—'}
                </td>
                <td className="text-ink-muted text-xs">
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucun parrainage
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoyaltyTab() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    code: '',
    label: '',
    trigger: 'TRANSFER',
    cashbackPercent: '',
    pointsFixed: '',
    minAmount: '',
    maxRewardPerTx: '',
    isActive: true,
  });

  async function load() {
    setItems(await marketingApi.listLoyalty());
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await marketingApi.upsertLoyalty({
      ...form,
      cashbackPercent: form.cashbackPercent ? Number(form.cashbackPercent) : null,
      pointsFixed: form.pointsFixed ? Number(form.pointsFixed) : null,
      minAmount: form.minAmount ? Number(form.minAmount) : null,
      maxRewardPerTx: form.maxRewardPerTx ? Number(form.maxRewardPerTx) : null,
    });
    setShow(false);
    setForm({
      code: '',
      label: '',
      trigger: 'TRANSFER',
      cashbackPercent: '',
      pointsFixed: '',
      minAmount: '',
      maxRewardPerTx: '',
      isActive: true,
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette règle ?')) return;
    await marketingApi.deleteLoyalty(id);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle règle
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Code</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Libellé</label>
              <input
                className="input"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Déclencheur</label>
              <select
                className="input"
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="REFERRAL">REFERRAL</option>
                <option value="DEPOSIT">DEPOSIT</option>
              </select>
            </div>
            <div>
              <label className="label">Cashback (%)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.cashbackPercent}
                onChange={(e) =>
                  setForm({ ...form, cashbackPercent: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Points fixes</label>
              <input
                type="number"
                className="input"
                value={form.pointsFixed}
                onChange={(e) =>
                  setForm({ ...form, pointsFixed: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Montant min tx</label>
              <input
                type="number"
                className="input"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Reward max / tx</label>
              <input
                type="number"
                className="input"
                value={form.maxRewardPerTx}
                onChange={(e) =>
                  setForm({ ...form, maxRewardPerTx: e.target.value })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Libellé</th>
              <th>Trigger</th>
              <th>Reward</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.code}</td>
                <td>{r.label}</td>
                <td>
                  <span className="badge-info">{r.trigger}</span>
                </td>
                <td className="text-xs">
                  {r.cashbackPercent && `${r.cashbackPercent}% cashback`}
                  {r.pointsFixed && `${r.pointsFixed} pts`}
                </td>
                <td>
                  <span
                    className={r.isActive ? 'badge-success' : 'badge-danger'}
                  >
                    {r.isActive ? 'OUI' : 'NON'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => remove(r.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucune règle
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
