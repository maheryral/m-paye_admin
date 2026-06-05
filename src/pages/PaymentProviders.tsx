import { useEffect, useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  Save,
  X,
  Zap,
} from 'lucide-react';
import {
  paymentProvidersApi,
  type PaymentProviderAdmin,
} from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

type ProviderType = 'CARD' | 'MOBILE_MONEY';

// Champs de clés (secrets) + config publique attendus par type/code.
const CREDENTIAL_FIELDS: Record<string, { key: string; label: string }[]> = {
  STRIPE: [{ key: 'secretKey', label: 'Clé secrète (sk_...)' }],
  AIRTEL_MONEY: [
    { key: 'consumerKey', label: 'Client ID Airtel (client_id)' },
    { key: 'consumerSecret', label: 'Client Secret Airtel (client_secret)' },
    {
      key: 'merchantNumber',
      label: 'Numéro marchand Airtel (compte plateforme — préfixe 033)',
    },
    {
      key: 'callbackSecret',
      label: 'Callback Secret (si Airtel notifie via webhook)',
    },
    {
      key: 'apiBaseUrl',
      label: 'API Base URL (sandbox: https://openapiuat.airtel.africa / prod: https://openapi.airtel.africa)',
    },
    {
      key: 'tokenUrl',
      label: 'Token URL (optionnel — auto-déduit de apiBaseUrl)',
    },
    { key: 'country', label: 'Country (défaut MG — Madagascar)' },
    { key: 'currency', label: 'Currency (défaut MGA)' },
  ],
  _MOBILE_MONEY: [
    { key: 'consumerKey', label: 'Consumer Key / Client ID' },
    { key: 'consumerSecret', label: 'Consumer Secret' },
    { key: 'apiKey', label: 'API Key (optionnel)' },
    {
      key: 'merchantNumber',
      label: 'Numéro marchand / short-code (compte plateforme)',
    },
    { key: 'partnerName', label: 'Nom partenaire (ex: M-Paye)' },
    {
      key: 'callbackSecret',
      label: 'Callback Secret (header x-callback-token attendu)',
    },
    {
      key: 'apiBaseUrl',
      label: 'API Base URL (défaut sandbox: https://pre-api.mvola.mg)',
    },
    {
      key: 'tokenUrl',
      label: 'Token URL (défaut: https://developer.mvola.mg/oauth2/token)',
    },
    {
      key: 'userLanguage',
      label: 'User Language (FR ou MG — défaut FR)',
    },
  ],
};
const PUBLIC_FIELDS: Record<string, { key: string; label: string }[]> = {
  STRIPE: [{ key: 'publishableKey', label: 'Clé publishable (pk_...)' }],
  _MOBILE_MONEY: [
    { key: 'operator', label: 'Opérateur (ex: MVola)' },
    { key: 'phonePrefix', label: 'Préfixe (ex: 034)' },
    { key: 'color', label: 'Couleur (#hex)' },
  ],
};

const PRESETS: {
  code: string;
  type: ProviderType;
  name: string;
}[] = [
  { code: 'STRIPE', type: 'CARD', name: 'Stripe (Cartes)' },
  { code: 'MVOLA', type: 'MOBILE_MONEY', name: 'MVola' },
  { code: 'ORANGE_MONEY', type: 'MOBILE_MONEY', name: 'Orange Money' },
  { code: 'AIRTEL_MONEY', type: 'MOBILE_MONEY', name: 'Airtel Money' },
];

const fieldsFor = (
  map: Record<string, { key: string; label: string }[]>,
  code: string,
  type: ProviderType,
) => map[code] ?? (type === 'MOBILE_MONEY' ? map._MOBILE_MONEY : []);

export default function PaymentProviders() {
  const [providers, setProviders] = useState<PaymentProviderAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{
    code: string;
    type: ProviderType;
    name: string;
    isActive: boolean;
    isSandbox: boolean;
    credentials: Record<string, string>;
    publicConfig: Record<string, any>;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null); // code en cours de test
  const [testResult, setTestResult] = useState<any | null>(null);

  async function load() {
    setLoading(true);
    try {
      setProviders(await paymentProvidersApi.list());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function openNew(preset: (typeof PRESETS)[number]) {
    const existing = providers.find((p) => p.code === preset.code);
    setErr(null);
    setEditing({
      code: preset.code,
      type: preset.type,
      name: existing?.name ?? preset.name,
      isActive: existing?.isActive ?? false,
      isSandbox: existing?.isSandbox ?? true,
      credentials: {},
      publicConfig: (existing?.publicConfig as Record<string, string>) ?? {},
    });
  }

  function openEdit(p: PaymentProviderAdmin) {
    setErr(null);
    setEditing({
      code: p.code,
      type: p.type,
      name: p.name,
      isActive: p.isActive,
      isSandbox: p.isSandbox,
      credentials: {}, // vides = on garde les clés existantes
      publicConfig: (p.publicConfig as Record<string, string>) ?? {},
    });
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setErr(null);
    try {
      await paymentProvidersApi.upsert({
        code: editing.code,
        type: editing.type,
        name: editing.name,
        isActive: editing.isActive,
        isSandbox: editing.isSandbox,
        credentials: editing.credentials, // seuls les champs remplis remplacent
        publicConfig: editing.publicConfig,
      });
      setEditing(null);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p: PaymentProviderAdmin) {
    await paymentProvidersApi.setActive(p.code, !p.isActive);
    load();
  }
  async function remove(code: string) {
    if (!confirm(`Supprimer le fournisseur ${code} ?`)) return;
    await paymentProvidersApi.remove(code);
    load();
  }

  async function runMvolaTest(code: string) {
    setTesting(code);
    setTestResult(null);
    try {
      const res = await paymentProvidersApi.testMvola(1000, '0343500004');
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        ok: false,
        error:
          e?.response?.data?.message ||
          e?.message ||
          'Erreur réseau lors du test',
        steps: [],
      });
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={CreditCard}
        title="Fournisseurs de paiement"
        subtitle="Saisissez les clés API ici — elles s'appliquent automatiquement au web et au mobile"
      />

      {/* Ajout rapide depuis les presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.code}
            onClick={() => openNew(preset)}
            className="btn btn-sm btn-ghost border border-bg-border"
          >
            {preset.type === 'CARD' ? (
              <CreditCard size={13} />
            ) : (
              <Smartphone size={13} />
            )}
            {preset.name}
            {providers.some((p) => p.code === preset.code) && (
              <span className="text-success-400 text-[10px]">● configuré</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Type</th>
                <th>Clés</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={CreditCard}
                      title="Aucun fournisseur configuré"
                      description="Choisissez un fournisseur ci-dessus et saisissez ses clés."
                    />
                  </td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr key={p.code}>
                    <td className="font-semibold">
                      {p.name}
                      <div className="text-ink-muted font-mono text-[11px]">
                        {p.code}
                      </div>
                    </td>
                    <td>
                      <span className="badge">
                        {p.type === 'CARD' ? 'Carte' : 'Mobile Money'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-ink-muted">
                      {Object.entries(p.credentials)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(', ') || '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => toggle(p)}
                        className={`badge ${
                          p.isActive
                            ? 'bg-success-500/15 text-success-400'
                            : 'bg-bg-elevated text-ink-muted'
                        }`}
                      >
                        {p.isActive ? 'Actif' : 'Inactif'}
                        {p.isSandbox ? ' · test' : ''}
                      </button>
                    </td>
                    <td className="text-right space-x-1">
                      {p.code === 'MVOLA' && (
                        <button
                          onClick={() => runMvolaTest(p.code)}
                          disabled={testing === p.code}
                          className="btn btn-sm btn-ghost border border-bg-border"
                          title="Test OAuth + POST sandbox (ne touche pas au wallet)"
                        >
                          <Zap size={12} />
                          {testing === p.code ? 'Test…' : 'Tester'}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="btn btn-sm btn-primary"
                      >
                        <Save size={12} /> Clés
                      </button>
                      <button
                        onClick={() => remove(p.code)}
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

      {/* Modal résultat test MVola */}
      {testResult && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto"
          onClick={() => setTestResult(null)}
        >
          <div
            className="card p-5 w-full max-w-lg my-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Zap size={16} />
                Test MVola
                {testResult.ok ? (
                  <span className="badge bg-success-500/15 text-success-400">
                    Succès
                  </span>
                ) : (
                  <span className="badge bg-danger-500/15 text-danger-400">
                    Échec
                  </span>
                )}
              </h3>
              <button
                onClick={() => setTestResult(null)}
                className="btn btn-sm btn-ghost"
              >
                <X size={16} />
              </button>
            </div>

            {testResult.summary && (
              <div className="text-sm text-success-400 bg-success-500/10 p-3 rounded-lg">
                {testResult.summary}
              </div>
            )}
            {testResult.error && !testResult.ok && (
              <div className="text-sm text-danger-400 bg-danger-bg p-3 rounded-lg">
                <div className="font-semibold mb-1">Erreur :</div>
                <div className="font-mono text-xs break-all">
                  {testResult.error}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(testResult.steps || []).map((s: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    s.ok
                      ? 'border-success-500/40 bg-success-500/5'
                      : 'border-danger-500/40 bg-danger-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {s.ok ? '✅' : '❌'} {s.step}
                  </div>
                  {s.details && (
                    <pre className="text-[11px] mt-2 font-mono text-ink-muted whitespace-pre-wrap break-all">
                      {JSON.stringify(s.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setTestResult(null)}
              className="btn btn-md btn-ghost w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal édition clés */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto"
          onClick={() => !busy && setEditing(null)}
        >
          <div
            className="card p-5 w-full max-w-md my-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">
                {editing.name}{' '}
                <span className="text-ink-muted font-mono text-xs">
                  {editing.code}
                </span>
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="btn btn-sm btn-ghost"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="label">Nom affiché</label>
              <input
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>

            {/* Clés secrètes */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-ink-muted uppercase">
                Clés secrètes (laisser vide = inchangé)
              </div>
              {fieldsFor(CREDENTIAL_FIELDS, editing.code, editing.type).map(
                (f) => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input
                      className="input font-mono"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={editing.credentials[f.key] ?? ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          credentials: {
                            ...editing.credentials,
                            [f.key]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ),
              )}
            </div>

            {/* Config publique */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-ink-muted uppercase">
                Config publique (exposée aux apps)
              </div>
              {fieldsFor(PUBLIC_FIELDS, editing.code, editing.type).map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    className="input font-mono"
                    value={editing.publicConfig[f.key] ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        publicConfig: {
                          ...editing.publicConfig,
                          [f.key]: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                />
                Actif
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isSandbox}
                  onChange={(e) =>
                    setEditing({ ...editing, isSandbox: e.target.checked })
                  }
                />
                Mode test (sandbox)
              </label>
            </div>

            {editing.type === 'MOBILE_MONEY' && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editing.publicConfig.payout}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      publicConfig: {
                        ...editing.publicConfig,
                        payout: e.target.checked,
                        payoutChannel: e.target.checked
                          ? 'MOBILE_MONEY'
                          : undefined,
                      },
                    })
                  }
                />
                Activer les retraits automatiques (versement Mobile Money)
              </label>
            )}

            {editing.type === 'MOBILE_MONEY' &&
              (editing.code === 'MVOLA' || editing.code === 'AIRTEL_MONEY') && (
                <label className="flex items-start gap-2 text-sm p-2 rounded-lg bg-warning-500/10 border border-warning-500/40">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!editing.publicConfig.devBypass}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        publicConfig: {
                          ...editing.publicConfig,
                          devBypass: e.target.checked,
                        },
                      })
                    }
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-warning-400">
                      ⚠️ Mode TEST DEV — bypass API {editing.code === 'MVOLA' ? 'MVola' : 'Airtel'}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-1">
                      Crédite le wallet sans appeler{' '}
                      {editing.code === 'MVOLA' ? 'MVola' : 'Airtel'} (utile
                      quand le sandbox est down).{' '}
                      <b>Désactivé d'office en production.</b> JAMAIS laisser
                      activé sur prod.
                    </div>
                  </div>
                </label>
              )}

            {err && (
              <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
                {err}
              </div>
            )}

            <button
              onClick={save}
              disabled={busy}
              className="btn btn-md btn-primary w-full"
            >
              <Plus size={14} /> {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
