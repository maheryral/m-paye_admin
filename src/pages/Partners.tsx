import { useEffect, useState } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  Pencil,
  Shield,
  X,
  Copy,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Check,
} from 'lucide-react';
import {
  partnersAdminApi,
  type Partner,
  type PartnerScope,
} from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import PartnerAntiFraudDialog from '../components/PartnerAntiFraudDialog';

const ALL_SCOPES: { code: PartnerScope; label: string; description: string }[] = [
  { code: 'auth_user', label: 'auth_user', description: 'ID anonymisé + nom court' },
  { code: 'auth_phone', label: 'auth_phone', description: 'Numéro de téléphone' },
  { code: 'auth_email', label: 'auth_email', description: 'Email' },
  { code: 'trade', label: 'trade', description: 'Créer des paiements (trades)' },
  { code: 'trade_refund', label: 'trade_refund', description: 'Initier des remboursements' },
  { code: 'wallet_balance', label: 'wallet_balance', description: 'Lire le solde du user' },
];

type FormState = {
  name: string;
  logoUrl: string;
  description: string;
  publicKeyPem: string;
  allowedScopes: PartnerScope[];
  redirectUris: string;
  webhookUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  logoUrl: '',
  description: '',
  publicKeyPem: '',
  allowedScopes: ['auth_user', 'trade'],
  redirectUris: '',
  webhookUrl: '',
  isActive: true,
};

/**
 * Gestion des PARTENAIRES OAuth — Phase 1 : enregistrement.
 * Phase 2 ajoutera les endpoints /oauth/token, /oauth/authorize.
 * Phase 3 ajoutera /trade/* + webhooks signés.
 */
export default function Partners() {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Affichage du app_secret en clair après création/rotation (1 seule fois)
  const [revealedPartner, setRevealedPartner] = useState<Partner | null>(null);

  // Phase 8 — dialog anti-fraude (anomalies + velocity)
  const [antiFraudPartner, setAntiFraudPartner] = useState<Partner | null>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await partnersAdminApi.list();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Partner) {
    setEditing(p);
    setForm({
      name: p.name,
      logoUrl: p.logoUrl ?? '',
      description: p.description ?? '',
      publicKeyPem: p.publicKeyPem,
      allowedScopes: p.allowedScopes,
      redirectUris: p.redirectUris.join('\n'),
      webhookUrl: p.webhookUrl ?? '',
      isActive: p.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Partial<Partner> = {
        name: form.name.trim(),
        logoUrl: form.logoUrl.trim() || null,
        description: form.description.trim() || null,
        publicKeyPem: form.publicKeyPem.trim(),
        allowedScopes: form.allowedScopes,
        redirectUris: form.redirectUris
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        webhookUrl: form.webhookUrl.trim() || null,
        isActive: form.isActive,
      };
      const result = editing
        ? await partnersAdminApi.update(editing.id, payload)
        : await partnersAdminApi.create(payload);
      setShowForm(false);
      // Si création, on affiche le app_secret en clair (présent dans result.appSecret)
      if (!editing && result.appSecret) {
        setRevealedPartner(result);
      }
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(p: Partner) {
    await partnersAdminApi.update(p.id, { isActive: !p.isActive });
    load();
  }

  async function rotateSecret(p: Partner) {
    if (
      !confirm(
        `Régénérer le app_secret de "${p.name}" ? L'ancien deviendra invalide ` +
          `immédiatement et il faudra transmettre le nouveau au partenaire.`,
      )
    ) {
      return;
    }
    try {
      const updated = await partnersAdminApi.rotateSecret(p.id);
      setRevealedPartner(updated);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Échec de la rotation');
    }
  }

  async function remove(p: Partner) {
    if (
      !confirm(
        `Supprimer définitivement le partenaire "${p.name}" ? ` +
          `Tous les tokens et trades liés deviendront orphelins.`,
      )
    ) {
      return;
    }
    try {
      await partnersAdminApi.remove(p.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Suppression impossible');
    }
  }

  function toggleScope(scope: PartnerScope) {
    setForm((f) => ({
      ...f,
      allowedScopes: f.allowedScopes.includes(scope)
        ? f.allowedScopes.filter((s) => s !== scope)
        : [...f.allowedScopes, scope],
    }));
  }

  return (
    <div>
      <PageHeader
        title="Partenaires OAuth"
        subtitle="Intégrations externes (pattern Alipay Open) — mini-programs tiers qui s'ouvrent dans M'Paye"
        icon={KeyRound}
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Nouveau partenaire
          </button>
        }
      />

      {loading ? (
        <div className="p-8 text-center text-ink-muted">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Aucun partenaire enregistré"
          description="Ajoute un partenaire pour qu'il puisse intégrer M'Paye via OAuth."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-elevated text-ink-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Partenaire</th>
                <th className="text-left px-4 py-3 font-semibold">app_id</th>
                <th className="text-left px-4 py-3 font-semibold">Scopes</th>
                <th className="text-center px-4 py-3 font-semibold">Actif</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-bg-border hover:bg-bg-elevated/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.logoUrl ? (
                        <img
                          src={p.logoUrl}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-contain bg-white"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center">
                          <KeyRound size={14} className="text-brand-300" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-ink-dim line-clamp-1 max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.appId}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.allowedScopes.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated border border-bg-border font-mono"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      role="switch"
                      aria-checked={p.isActive}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        p.isActive
                          ? 'bg-success-500'
                          : 'bg-bg-elevated border border-bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          p.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        p.isActive ? 'text-success-400' : 'text-ink-dim'
                      }`}
                    >
                      {p.isActive ? 'ON' : 'OFF'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setAntiFraudPartner(p)}
                        className="p-1.5 rounded hover:bg-bg-elevated text-ink-dim hover:text-primary-400"
                        title="Anti-fraude (anomalies + velocity)"
                      >
                        <Shield size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => rotateSecret(p)}
                        className="p-1.5 rounded hover:bg-warning-bg text-warning-400"
                        title="Régénérer app_secret"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded hover:bg-bg-elevated"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="p-1.5 rounded hover:bg-danger-bg text-danger-400"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ───── Form create/edit ───── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card max-w-2xl w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editing ? 'Modifier le partenaire' : 'Nouveau partenaire'}
              </h2>
              <button onClick={() => setShowForm(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nom du partenaire</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Hôtel Carlton"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Logo URL (optionnel)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="https://…/carlton-logo.png"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Hôtellerie de luxe à Antananarivo…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  Public key RSA-2048 (PEM){' '}
                  <span className="text-[10px] text-ink-dim">— fournie par le partenaire</span>
                </label>
                <textarea
                  className="input font-mono text-[11px]"
                  rows={8}
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                  value={form.publicKeyPem}
                  onChange={(e) =>
                    setForm({ ...form, publicKeyPem: e.target.value })
                  }
                  required={!editing}
                  spellCheck={false}
                />
                <p className="text-[11px] text-ink-dim mt-1">
                  Le partenaire génère sa keypair (RSA-2048) et te transmet uniquement la
                  public key. La private key reste secrète chez eux.
                </p>
              </div>

              <div>
                <label className="label">Scopes autorisés</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SCOPES.map((s) => (
                    <label
                      key={s.code}
                      className="flex items-start gap-2 p-2 rounded border border-bg-border hover:border-brand-500/40 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.allowedScopes.includes(s.code)}
                        onChange={() => toggleScope(s.code)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold">{s.label}</div>
                        <div className="text-[10px] text-ink-dim">{s.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  Redirect URIs <span className="text-[10px] text-ink-dim">— une par ligne</span>
                </label>
                <textarea
                  className="input font-mono text-xs"
                  rows={3}
                  placeholder="https://carlton.mg/oauth/callback"
                  value={form.redirectUris}
                  onChange={(e) => setForm({ ...form, redirectUris: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Webhook URL (réception des events signés)</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="https://carlton.mg/api/mpaye-webhook"
                  value={form.webhookUrl}
                  onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Actif</span>
                </label>
                {!editing && (
                  <div className="text-[11px] text-warning-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Le app_secret sera affiché 1 SEULE FOIS après création
                  </div>
                )}
              </div>

              {error && (
                <div className="p-2 rounded bg-danger-bg text-danger-400 text-xs">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '…' : editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Affichage app_secret 1-shot ───── */}
      {revealedPartner && revealedPartner.appSecret && (
        <SecretRevealModal
          partner={revealedPartner}
          onClose={() => setRevealedPartner(null)}
        />
      )}

      {/* ───── Phase 8 — Dialog anti-fraude ───── */}
      {antiFraudPartner && (
        <PartnerAntiFraudDialog
          partner={antiFraudPartner}
          onClose={() => setAntiFraudPartner(null)}
        />
      )}
    </div>
  );
}

// ───── Modal d'affichage du app_secret (1 seule fois) ─────
function SecretRevealModal({
  partner,
  onClose,
}: {
  partner: Partner;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(value: string, field: string) {
    void navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warning-bg text-warning-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Identifiants partenaire</h3>
            <p className="text-xs text-ink-muted">
              Copie l'app_secret MAINTENANT — il ne sera plus jamais affiché.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <SecretRow
            label="app_id (public)"
            value={partner.appId}
            copied={copiedField === 'appId'}
            onCopy={() => copy(partner.appId, 'appId')}
          />
          <SecretRow
            label="app_secret (à transmettre au partenaire en canal sécurisé)"
            value={partner.appSecret!}
            copied={copiedField === 'secret'}
            onCopy={() => copy(partner.appSecret!, 'secret')}
            danger
          />
        </div>

        <div className="bg-warning-bg border border-warning-500/30 text-warning-400 text-xs p-3 rounded-lg flex gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Transmets ces identifiants à <strong>{partner.name}</strong> via un canal
            sécurisé (1Password, mail signé, etc.) — pas par chat ou email en clair.
            <br />
            Si l'app_secret est perdu, tu devras utiliser "Régénérer app_secret"
            (l'ancien deviendra invalide).
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="btn-primary">
            J'ai copié — Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function SecretRow({
  label,
  value,
  copied,
  onCopy,
  danger,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-ink-muted mb-1">{label}</div>
      <div
        className={`flex items-center gap-2 p-2 rounded border ${
          danger
            ? 'border-warning-500/40 bg-warning-bg/30'
            : 'border-bg-border bg-bg-elevated'
        }`}
      >
        <code className="flex-1 text-xs font-mono break-all">{value}</code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 p-1.5 rounded hover:bg-bg-elevated"
          title="Copier"
        >
          {copied ? (
            <Check size={14} className="text-success-400" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
