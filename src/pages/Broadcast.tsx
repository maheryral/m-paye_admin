import { useState } from 'react';
import { Megaphone, Eye, Send } from 'lucide-react';
import { broadcastApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

type Audience = 'ALL' | 'USERS' | 'MERCHANTS' | 'ADMINS';

export default function Broadcast() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    body: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH',
    audience: 'ALL' as Audience,
    icon: 'megaphone',
    color: '#5B52E8',
  });
  const [target, setTarget] = useState<number | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function previewTarget() {
    setBusy(true);
    setErr(null);
    try {
      const res = await broadcastApi.preview({ audience: form.audience });
      setTarget(res.target);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!form.title || !form.message) {
      setErr('Title et message obligatoires');
      return;
    }
    if (
      !confirm(
        `Envoyer cette notification à l'audience "${form.audience}" ${target ? `(${target} users)` : ''} ?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await broadcastApi.send(form);
      setSent(res.sent);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Diffuser une notification"
        subtitle="Envoi push/in-app à un segment d'utilisateurs"
      />

      {sent !== null && (
        <div className="card p-4 mb-4 bg-success-bg border-success-500/30 text-sm">
          ✅ {sent} notification(s) envoyée(s) avec succès.
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Audience</label>
            <select
              className="input"
              value={form.audience}
              onChange={(e) => {
                setForm({ ...form, audience: e.target.value as Audience });
                setTarget(null);
              }}
            >
              <option value="ALL">Tous les utilisateurs actifs</option>
              <option value="USERS">Utilisateurs standards uniquement</option>
              <option value="MERCHANTS">Marchands uniquement</option>
              <option value="ADMINS">Admins & Super-admins</option>
            </select>
          </div>
          <div>
            <label className="label">Priorité</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as any })
              }
            >
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">
            Titre <span className="text-danger-400">*</span>
          </label>
          <input
            className="input"
            maxLength={191}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Maintenance prévue dimanche soir"
          />
          <div className="text-[10px] text-ink-dim mt-1">
            {form.title.length} / 191
          </div>
        </div>

        <div>
          <label className="label">
            Message court <span className="text-danger-400">*</span>
          </label>
          <input
            className="input"
            maxLength={191}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Une ligne qui apparaît dans la liste"
          />
        </div>

        <div>
          <label className="label">
            Corps détaillé <span className="text-ink-dim">(optionnel)</span>
          </label>
          <textarea
            className="input min-h-[100px]"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Texte plus long affiché au clic"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Icône (Lucide)</label>
            <input
              className="input"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Couleur</label>
            <input
              className="input"
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
        </div>

        {target !== null && (
          <div className="bg-bg-elevated rounded-xl p-3 text-sm">
            🎯 Audience estimée :{' '}
            <span className="font-bold text-brand-300">
              {target.toLocaleString('fr-FR')}
            </span>{' '}
            destinataire(s)
          </div>
        )}

        {err && (
          <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={previewTarget}
            disabled={busy}
            className="btn btn-md btn-secondary"
          >
            <Eye size={14} /> Compter l'audience
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy || !form.title || !form.message}
            className="btn btn-md btn-primary"
          >
            <Send size={14} /> Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
