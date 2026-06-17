import { useEffect, useState } from 'react';
import { Mail, Save, Send } from 'lucide-react';
import {
  emailSettingsAdminApi,
  type EmailSettings as EmailSettingsType,
} from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

export default function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    fromName: "M'Paye",
    fromEmail: '',
    enabled: false,
  });

  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const s: EmailSettingsType = await emailSettingsAdminApi.get();
      setForm({
        host: s.host || 'smtp.gmail.com',
        port: s.port || 587,
        username: s.username || '',
        password: '',
        fromName: s.fromName || "M'Paye",
        fromEmail: s.fromEmail || '',
        enabled: s.enabled,
      });
      setHasPassword(s.hasPassword);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const dto: any = {
        host: form.host,
        port: Number(form.port),
        username: form.username,
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        enabled: form.enabled,
      };
      if (form.password) dto.password = form.password; // sinon on garde l'existant
      const s = await emailSettingsAdminApi.update(dto);
      setHasPassword(s.hasPassword);
      setForm((f) => ({ ...f, password: '' }));
      setMsg({ type: 'ok', text: 'Réglages enregistrés.' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Erreur' });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!testTo.trim()) return;
    setTesting(true);
    setMsg(null);
    try {
      const r = await emailSettingsAdminApi.test(testTo.trim());
      setMsg({ type: r.success ? 'ok' : 'err', text: r.message });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.response?.data?.message || 'Échec du test' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Chargement…</div>;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        icon={Mail}
        title="Réglages email (SMTP)"
        subtitle="Configurez l'envoi des emails (OTP, bienvenue). Par défaut : Gmail."
      />

      {msg && (
        <div
          className={`card mb-4 p-3 text-sm ${
            msg.type === 'ok'
              ? 'bg-success-bg text-success-400 border-success-500/30'
              : 'bg-danger-bg text-danger-400 border-danger-500/30'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Activation */}
      <div className="card mb-4 flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-bold">Activer l'envoi d'emails</div>
          <div className="text-xs text-ink-muted">
            Si désactivé, l'app retombe sur les variables d'environnement (.env).
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          <div className="h-6 w-11 rounded-full bg-bg-border after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-5" />
        </label>
      </div>

      {/* Form SMTP */}
      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Serveur SMTP</label>
            <input
              className="input"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="label">Port</label>
            <input
              className="input"
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              placeholder="587"
            />
          </div>
        </div>

        <div>
          <label className="label">Identifiant (email Gmail)</label>
          <input
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="tonadresse@gmail.com"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="label">
            Mot de passe d'application{hasPassword ? ' (déjà défini — laisser vide pour garder)' : ''}
          </label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={hasPassword ? '•••••••••••• (inchangé)' : 'Mot de passe d’application 16 car.'}
            autoComplete="new-password"
          />
          <div className="mt-1 text-xs text-ink-dim">
            Gmail : active la 2FA puis crée un « mot de passe d'application » sur
            myaccount.google.com/apppasswords.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nom expéditeur</label>
            <input
              className="input"
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              placeholder="M'Paye"
            />
          </div>
          <div>
            <label className="label">Email expéditeur</label>
            <input
              className="input"
              value={form.fromEmail}
              onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              placeholder="tonadresse@gmail.com"
            />
            <div className="mt-1 text-xs text-ink-dim">
              Avec Gmail, doit être identique à l'identifiant.
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn btn-md btn-primary"
        >
          <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Test */}
      <div className="card mt-4 p-5">
        <div className="mb-2 text-sm font-bold">Tester la configuration</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Adresse de réception du test"
          />
          <button
            onClick={sendTest}
            disabled={testing || !testTo.trim()}
            className="btn btn-md btn-secondary"
          >
            <Send size={16} /> {testing ? 'Envoi…' : 'Envoyer un test'}
          </button>
        </div>
        <div className="mt-2 text-xs text-ink-dim">
          Enregistre d'abord tes réglages, puis envoie un email de test.
        </div>
      </div>
    </div>
  );
}
