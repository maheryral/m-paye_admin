import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LogIn,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Step = 'credentials' | '2fa' | 'enroll';

export default function Login() {
  const navigate = useNavigate();
  const { login, verify2fa } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === '2fa') {
      setTimeout(() => codeInputRef.current?.focus(), 50);
    }
  }, [step]);

  async function onSubmitCreds(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res.kind === 'success') {
        navigate('/', { replace: true });
      } else if (res.kind === '2fa') {
        setChallengeToken(res.challengeToken);
        setStep('2fa');
      } else if (res.kind === '2fa-enroll') {
        setStep('enroll');
      }
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'Identifiants invalides',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setErr(null);
    setLoading(true);
    try {
      await verify2fa(challengeToken, code);
      navigate('/', { replace: true });
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'Code 2FA invalide',
      );
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  function back() {
    setStep('credentials');
    setCode('');
    setChallengeToken(null);
    setErr(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs animés */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-500/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-[150px]" />
      </div>

      {/* Grid pattern subtle */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + titre */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-brand rounded-3xl blur-2xl opacity-60 animate-pulse" />
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <Shield size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            M'Paye <span className="bg-gradient-to-r from-brand-300 to-fuchsia-400 bg-clip-text text-transparent">Admin</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-400" />
            Console d'administration plateforme
          </p>
        </div>

        {/* Card login */}
        {step === 'credentials' && (
          <form
            onSubmit={onSubmitCreds}
            className="card-elevated p-7 space-y-5 animate-slide-in"
          >
            <div>
              <label className="label">Email ou téléphone</label>
              <input
                className="input"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@m-paye.mg"
                required
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink p-1 rounded transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 text-xs text-danger-400 bg-danger-bg/60 p-3 rounded-xl border border-danger-500/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg btn-primary w-full"
            >
              {!loading && <LogIn size={16} />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}

        {step === '2fa' && (
          <form
            onSubmit={onSubmit2fa}
            className="card-elevated p-7 space-y-5 animate-slide-in"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <div>
                <div className="text-sm font-bold">Vérification 2FA</div>
                <div className="text-xs text-ink-muted">
                  Code à 6 chiffres de votre app TOTP
                </div>
              </div>
            </div>

            <div>
              <label className="label">Code à 6 chiffres</label>
              <input
                ref={codeInputRef}
                className="input text-center text-2xl tracking-[0.6em] font-mono py-3"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={9}
                required
              />
              <div className="text-[10px] text-ink-dim mt-1.5 text-center">
                TOTP : 6 chiffres · Backup : XXXX-XXXX
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 text-xs text-danger-400 bg-danger-bg/60 p-3 rounded-xl border border-danger-500/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={back}
                className="btn btn-md btn-ghost"
                disabled={loading}
              >
                <ArrowLeft size={14} /> Retour
              </button>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="btn btn-md btn-primary flex-1"
              >
                {loading ? 'Vérification…' : 'Vérifier'}
              </button>
            </div>
          </form>
        )}

        {step === 'enroll' && (
          <div className="card-elevated p-7 space-y-4 animate-slide-in">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-warning-bg text-warning-500 flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <span className="text-sm font-bold text-warning-500">
                Enrôlement 2FA obligatoire
              </span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Votre rôle nécessite l'activation de la 2FA. Demandez à un
              super-admin de désactiver temporairement l'enforcement, puis
              activez la 2FA depuis la page <span className="text-ink font-semibold">Mon 2FA</span>.
            </p>
            <button onClick={back} className="btn btn-md btn-secondary w-full">
              <ArrowLeft size={14} /> Retour
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 text-[10px] text-ink-dim mt-6 uppercase tracking-wider font-bold">
          <div className="h-px w-12 bg-bg-border" />
          Accès réservé super-admins
          <div className="h-px w-12 bg-bg-border" />
        </div>
      </div>
    </div>
  );
}
