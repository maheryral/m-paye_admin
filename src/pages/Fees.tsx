import { useEffect, useState } from 'react';
import { Percent, Plus, Trash2, TrendingUp } from 'lucide-react';
import { feesAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

interface Fee {
  id: string;
  type: string;
  mode: string;
  value: string;
  min?: string | null;
  max?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Revenue {
  byType: { type: string; currency: string; amount: string; count: number }[];
  total: { amount: string; count: number };
}

export default function Fees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'TRANSFER',
    mode: 'PERCENT',
    value: 0,
    min: '',
    max: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [list, rev] = await Promise.all([
        feesAdminApi.list(),
        feesAdminApi.revenue(),
      ]);
      setFees(list);
      setRevenue(rev);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createFee(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feesAdminApi.create({
        ...form,
        value: Number(form.value),
        min: form.min ? Number(form.min) : undefined,
        max: form.max ? Number(form.max) : undefined,
      });
      setShowForm(false);
      setForm({ type: 'TRANSFER', mode: 'PERCENT', value: 0, min: '', max: '' });
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(fee: Fee) {
    await feesAdminApi.update(fee.id, { isActive: !fee.isActive });
    load();
  }

  async function removeFee(fee: Fee) {
    if (!confirm(`Désactiver ce frais (${fee.type} ${fee.mode}) ?`)) return;
    await feesAdminApi.remove(fee.id);
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Percent}
        title="Frais & Revenus"
        subtitle="Configuration des frais et statistiques de revenus plateforme"
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-md btn-primary"
          >
            <Plus size={16} />
            {showForm ? 'Fermer' : 'Nouveau frais'}
          </button>
        }
      />

      {/* Revenue summary */}
      {revenue && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-success-500" />
            <span className="text-sm font-bold">Revenus plateforme (total)</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {Number(revenue.total.amount).toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-ink-muted">
            {revenue.total.count} prélèvements enregistrés
          </div>

          {revenue.byType.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {revenue.byType.map((r, i) => (
                <div key={i} className="bg-bg-elevated rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink-dim">
                    {r.type}
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {Number(r.amount).toLocaleString('fr-FR')} {r.currency}
                  </div>
                  <div className="text-xs text-ink-muted">{r.count} ops</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={createFee} className="card p-5 mb-6 space-y-3">
          <div className="text-sm font-bold mb-2">Nouveau frais</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Type d'opération</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="DEPOSIT">DEPOSIT</option>
                <option value="WITHDRAWAL">WITHDRAWAL</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="REFUND">REFUND</option>
              </select>
            </div>
            <div>
              <label className="label">Mode de calcul</label>
              <select
                className="input"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                <option value="PERCENT">PERCENT (%)</option>
                <option value="FIXED">FIXED (montant fixe)</option>
              </select>
            </div>
            <div>
              <label className="label">Valeur</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) =>
                  setForm({ ...form, value: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Min</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.min}
                  onChange={(e) => setForm({ ...form, min: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Max</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.max}
                  onChange={(e) => setForm({ ...form, max: e.target.value })}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-md btn-primary"
          >
            {submitting ? 'Création…' : 'Créer le frais'}
          </button>
        </form>
      )}

      {/* Fees table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>Mode</th>
                <th>Valeur</th>
                <th>Min</th>
                <th>Max</th>
                <th>État</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-3 w-16" /></td>
                    <td><div className="skeleton h-3 w-12" /></td>
                    <td><div className="skeleton h-3 w-10" /></td>
                    <td><div className="skeleton h-3 w-10" /></td>
                    <td><div className="skeleton h-4 w-14" /></td>
                    <td><div className="skeleton h-6 w-8" /></td>
                  </tr>
                ))
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Percent}
                      title="Aucun frais configuré"
                      description="Cliquez sur 'Nouveau frais' pour ajouter une règle."
                    />
                  </td>
                </tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id}>
                    <td className="font-semibold">{f.type}</td>
                    <td>{f.mode}</td>
                    <td className="font-mono">
                      {f.value}
                      {f.mode === 'PERCENT' ? '%' : ''}
                    </td>
                    <td className="text-ink-muted">{f.min ?? '—'}</td>
                    <td className="text-ink-muted">{f.max ?? '—'}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(f)}
                        className={f.isActive ? 'badge-success' : 'badge-danger'}
                      >
                        {f.isActive ? 'ACTIF' : 'INACTIF'}
                      </button>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => removeFee(f)}
                        className="btn btn-sm btn-ghost text-danger-400 hover:text-danger-500"
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
