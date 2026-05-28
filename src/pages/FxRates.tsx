import { useEffect, useState } from 'react';
import { Coins, Save, Trash2, Plus } from 'lucide-react';
import { fxRatesApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

interface Rate {
  paire: string;
  taux: string;
  date: string;
}

export default function FxRates() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ paire: '', taux: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await fxRatesApi.list();
      setRates(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await fxRatesApi.upsert({
        paire: form.paire.trim().toUpperCase(),
        taux: Number(form.taux),
      });
      setForm({ paire: '', taux: '' });
      setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function updateTaux(paire: string) {
    const v = Number(edit[paire]);
    if (!v || v <= 0) return;
    await fxRatesApi.upsert({ paire, taux: v });
    setEdit({ ...edit, [paire]: '' });
    load();
  }

  async function remove(paire: string) {
    if (!confirm(`Supprimer la paire ${paire} ?`)) return;
    await fxRatesApi.remove(paire);
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Coins}
        title="Taux de change (FX)"
        subtitle="Configuration des taux pour les conversions multi-devises"
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-md btn-primary"
          >
            <Plus size={14} /> Nouvelle paire
          </button>
        }
      />

      {showForm && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Paire (format XXX_YYY)</label>
              <input
                className="input font-mono uppercase"
                value={form.paire}
                onChange={(e) =>
                  setForm({ ...form, paire: e.target.value.toUpperCase() })
                }
                placeholder="MGA_EUR"
                required
              />
            </div>
            <div>
              <label className="label">Taux</label>
              <input
                type="number"
                step="0.00000001"
                className="input"
                value={form.taux}
                onChange={(e) => setForm({ ...form, taux: e.target.value })}
                placeholder="0.00020"
                required
              />
            </div>
          </div>
          {err && (
            <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn btn-md btn-primary"
          >
            {busy ? 'Envoi…' : 'Enregistrer'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Paire</th>
                <th>Taux actuel</th>
                <th>Nouveau taux</th>
                <th>Mis à jour</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton h-3 w-16" /></td>
                    <td><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-7 w-24" /></td>
                    <td><div className="skeleton h-3 w-24" /></td>
                    <td><div className="skeleton h-7 w-16" /></td>
                  </tr>
                ))
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Coins}
                      title="Aucun taux configuré"
                      description='Cliquez sur "Nouvelle paire" pour ajouter votre 1er taux.'
                    />
                  </td>
                </tr>
              ) : (
                rates.map((r) => (
                  <tr key={r.paire}>
                    <td className="font-mono font-bold">{r.paire}</td>
                    <td className="font-mono">{r.taux}</td>
                    <td>
                      <input
                        type="number"
                        step="0.00000001"
                        className="input w-32"
                        value={edit[r.paire] ?? ''}
                        onChange={(e) =>
                          setEdit({ ...edit, [r.paire]: e.target.value })
                        }
                        placeholder="Modifier…"
                      />
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(r.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => updateTaux(r.paire)}
                        disabled={!edit[r.paire]}
                        className="btn btn-sm btn-primary"
                      >
                        <Save size={12} />
                      </button>
                      <button
                        onClick={() => remove(r.paire)}
                        className="btn btn-sm btn-ghost text-danger-400 hover:text-danger-500"
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
    </div>
  );
}
