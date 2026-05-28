import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { authService } from '../services/api';

type Mode = 'idle' | 'setup' | 'confirm' | 'enabled' | 'disabling';

export default function Security2FA() {
  const [mode, setMode] = useState<Mode>('idle');
  const [status, setStatus] = useState<any>(null);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUri: string;
  } | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Disable form
  const [pwd, setPwd] = useState('');
  const [disableCode, setDisableCode] = useState('');

  // Regenerate
  const [regenCode, setRegenCode] = useState('');

  async function load() {
    try {
      const s = await authService.status2fa();
      setStatus(s);
      if (s.enabled) setMode('enabled');
      else setMode('idle');
    } catch (e: any) {
      setErr(e?.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function startSetup() {
    setErr(null);
    setBusy(true);
    try {
      const data = await authService.setup2fa();
      setSetupData(data);
      setMode('setup');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur de setup');
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await authService.confirm2fa(confirmCode);
      setBackupCodes(res.backupCodes);
      setMode('confirm');
      setConfirmCode('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Code invalide');
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await authService.disable2fa(pwd, disableCode);
      setPwd('');
      setDisableCode('');
      setMode('idle');
      setSetupData(null);
      setBackupCodes(null);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Désactivation refusée');
    } finally {
      setBusy(false);
    }
  }

  async function regenBackups(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await authService.regenerateBackupCodes(regenCode);
      setBackupCodes(res.backupCodes);
      setRegenCode('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadBackupCodes() {
    if (!backupCodes) return;
    const txt =
      `M'Paye Super Admin — Codes de secours 2FA\n` +
      `Généré le : ${new Date().toISOString()}\n` +
      `\n⚠️  Chaque code est utilisable UNE SEULE FOIS.\n` +
      `Conservez-les dans un endroit sûr (gestionnaire de mots de passe).\n\n` +
      backupCodes.map((c, i) => `${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mpaye-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound size={22} className="text-brand-400" />
          Authentification à deux facteurs (2FA)
        </h1>
        <p className="text-sm text-ink-muted">
          Protégez votre compte super-admin avec une app TOTP (Google
          Authenticator, Authy, 1Password…)
        </p>
      </div>

      {err && (
        <div className="card p-3 mb-4 bg-danger-bg border-danger-500/30 text-sm text-danger-400 flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {err}
        </div>
      )}

      {/* État courant */}
      {status && (
        <div
          className={`card p-5 mb-4 ${
            status.enabled
              ? 'border-success-500/30 bg-success-bg/20'
              : 'border-warning-500/30 bg-warning-bg/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.enabled ? (
                <ShieldCheck size={24} className="text-success-500" />
              ) : (
                <ShieldOff size={24} className="text-warning-500" />
              )}
              <div>
                <div className="text-base font-bold">
                  2FA {status.enabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
                </div>
                {status.enabled && (
                  <div className="text-xs text-ink-muted">
                    Méthode : {status.method} ·{' '}
                    {status.backupCodesLeft} code(s) de secours restant(s)
                    {status.lastUsedAt &&
                      ` · Dernière utilisation : ${new Date(
                        status.lastUsedAt,
                      ).toLocaleString('fr-FR')}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode IDLE — pas de 2FA */}
      {mode === 'idle' && !status?.enabled && (
        <div className="card p-6">
          <p className="text-sm text-ink-muted mb-4">
            Une fois activée, vous devrez saisir un code à 6 chiffres à
            chaque connexion. En cas de perte de votre appareil, utilisez
            un des 10 codes de secours générés à l'activation.
          </p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="btn btn-md btn-primary"
          >
            <ShieldCheck size={14} /> Activer la 2FA
          </button>
        </div>
      )}

      {/* Mode SETUP — QR code + secret */}
      {mode === 'setup' && setupData && (
        <form onSubmit={confirmSetup} className="card p-6 space-y-5">
          <div>
            <div className="text-sm font-bold mb-2">
              1. Scannez le QR code avec votre application TOTP
            </div>
            <div className="bg-white p-4 rounded-xl w-fit mx-auto">
              <QRCodeSVG value={setupData.otpauthUri} size={200} level="M" />
            </div>
          </div>

          <div>
            <div className="text-sm font-bold mb-2">
              2. Ou saisissez le secret manuellement
            </div>
            <div className="flex gap-2">
              <code className="flex-1 bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-mono break-all">
                {setupData.secret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="btn btn-md btn-secondary"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold mb-2">
              3. Saisissez le code à 6 chiffres affiché par l'app
            </div>
            <input
              className="input text-center text-lg tracking-[0.5em] font-mono"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setSetupData(null);
                setConfirmCode('');
              }}
              className="btn btn-md btn-ghost"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || confirmCode.length !== 6}
              className="btn btn-md btn-success flex-1"
            >
              {busy ? 'Vérification…' : 'Activer la 2FA'}
            </button>
          </div>
        </form>
      )}

      {/* Mode CONFIRM — affiche les backup codes une fois */}
      {(mode === 'confirm' || backupCodes) && backupCodes && (
        <div className="card p-6 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={18} className="text-warning-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-warning-500">
                Sauvegardez vos codes de secours maintenant
              </div>
              <div className="text-xs text-ink-muted">
                Ces codes ne seront plus affichés. Chacun est utilisable
                UNE SEULE FOIS si vous perdez votre app.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-bg-elevated p-4 rounded-xl mb-3">
            {backupCodes.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-ink-dim">
                  {(i + 1).toString().padStart(2, '0')}.
                </span>
                <span>{c}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadBackupCodes}
              className="btn btn-md btn-primary flex-1"
            >
              <Download size={14} /> Télécharger
            </button>
            <button
              onClick={() => {
                setBackupCodes(null);
                if (status?.enabled) setMode('enabled');
                else setMode('idle');
              }}
              className="btn btn-md btn-secondary"
            >
              <Check size={14} /> J'ai sauvegardé
            </button>
          </div>
        </div>
      )}

      {/* Mode ENABLED — gestion */}
      {mode === 'enabled' && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="text-sm font-bold mb-3 flex items-center gap-2">
              <RefreshCw size={14} /> Régénérer les codes de secours
            </div>
            <form onSubmit={regenBackups} className="flex gap-2">
              <input
                className="input flex-1 text-center font-mono"
                placeholder="Code TOTP courant"
                value={regenCode}
                onChange={(e) => setRegenCode(e.target.value)}
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={busy || regenCode.length !== 6}
                className="btn btn-md btn-secondary"
              >
                Régénérer
              </button>
            </form>
            <div className="text-[10px] text-ink-dim mt-2">
              ⚠️ Cela invalide tous les codes de secours précédents.
            </div>
          </div>

          <div className="card p-6 border-danger-500/30">
            <div className="text-sm font-bold mb-3 flex items-center gap-2 text-danger-400">
              <ShieldOff size={14} /> Désactiver la 2FA
            </div>
            <form onSubmit={disable} className="space-y-3">
              <div>
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  className="input"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Code TOTP courant</label>
                <input
                  className="input text-center font-mono"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy || !pwd || disableCode.length !== 6}
                className="btn btn-md btn-danger"
              >
                Désactiver définitivement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
