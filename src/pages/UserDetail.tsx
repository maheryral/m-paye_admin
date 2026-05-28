import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Check,
  KeyRound,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { usersAdminApi } from '../services/superAdminApi';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        usersAdminApi.getOne(id),
        usersAdminApi.sessions(id),
      ]);
      setUser(u);
      setSessions(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!user) return <div className="text-sm text-danger-400">Introuvable</div>;

  async function toggleActive() {
    if (!id) return;
    const verb = user.isActive ? 'désactiver' : 'réactiver';
    if (!confirm(`Confirmer : ${verb} ce compte ?`)) return;
    await usersAdminApi.setActive(id, !user.isActive);
    setMsg(`Compte ${verb === 'désactiver' ? 'désactivé' : 'réactivé'}`);
    load();
  }

  async function changeRole(role: string) {
    if (!id) return;
    if (!confirm(`Changer le rôle pour ${role} ?`)) return;
    await usersAdminApi.setRole(id, role);
    setMsg(`Rôle mis à jour : ${role}`);
    load();
  }

  async function revokeAll() {
    if (!id) return;
    if (!confirm('Déconnecter tous les appareils de cet utilisateur ?')) return;
    const res = await usersAdminApi.revokeSessions(id);
    setMsg(`${res.revoked} session(s) révoquée(s)`);
    load();
  }

  async function resetPwd() {
    if (!id || newPassword.length < 8) return;
    setSubmitting(true);
    try {
      await usersAdminApi.resetPassword(id, newPassword);
      setMsg('Mot de passe réinitialisé');
      setNewPassword('');
      setShowReset(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <Link
        to="/users"
        className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Retour aux utilisateurs
      </Link>

      {msg && (
        <div className="card p-3 mb-4 bg-success-bg border-success-500/30 text-sm text-success-400">
          {msg}
        </div>
      )}

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {user.prenom} {user.nom}
            </h1>
            <div className="text-sm text-ink-muted mt-1">{user.email}</div>
            <div className="text-sm text-ink-muted">{user.telephone}</div>
          </div>
          <div className="text-right space-y-2">
            <div>
              <span
                className={
                  user.role === 'SUPER_ADMIN'
                    ? 'badge-danger'
                    : user.role === 'ADMIN'
                      ? 'badge-info'
                      : 'badge-warning'
                }
              >
                {user.role}
              </span>
            </div>
            <div>
              <span
                className={user.isActive ? 'badge-success' : 'badge-danger'}
              >
                {user.isActive ? 'ACTIF' : 'INACTIF'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-bg-border">
          <Stat label="KYC" value={user.kycLevel} />
          <Stat label="Sessions" value={user._count?.sessions ?? 0} />
          <Stat label="Devices" value={user._count?.devices ?? 0} />
          <Stat label="Marchands" value={user.merchants?.length ?? 0} />
        </div>

        {user.accounts?.[0]?.wallets?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-bg-border">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">
              Wallets
            </div>
            {user.accounts[0].wallets.map((w: any) => (
              <div key={w.id} className="flex justify-between text-sm">
                <span className="font-mono text-xs text-ink-muted">{w.id}</span>
                <span className="font-bold">
                  {Number(w.soldeDisponible).toLocaleString('fr-FR')} {w.devise}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card p-6 mb-6">
        <div className="text-sm font-bold mb-3 flex items-center gap-2">
          <ShieldAlert size={16} /> Actions administratives
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={toggleActive}
            className={`btn btn-md ${user.isActive ? 'btn-danger' : 'btn-success'}`}
          >
            {user.isActive ? (
              <>
                <Ban size={14} /> Désactiver le compte
              </>
            ) : (
              <>
                <Check size={14} /> Réactiver le compte
              </>
            )}
          </button>
          <button
            onClick={revokeAll}
            className="btn btn-md btn-secondary"
          >
            <LogOut size={14} /> Déconnecter tous les appareils
          </button>
          <button
            onClick={() => setShowReset((v) => !v)}
            className="btn btn-md btn-secondary"
          >
            <KeyRound size={14} /> Réinitialiser le mot de passe
          </button>
        </div>

        {/* Role selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-ink-dim">Changer le rôle :</span>
          {['USER', 'ADMIN', 'SUPER_ADMIN'].map((r) => (
            <button
              key={r}
              disabled={user.role === r}
              onClick={() => changeRole(r)}
              className={`btn btn-sm ${user.role === r ? 'btn-primary' : 'btn-ghost'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {showReset && (
          <div className="bg-bg-elevated rounded-xl p-4 space-y-3">
            <label className="label">Nouveau mot de passe (min. 8 car.)</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={resetPwd}
              disabled={submitting || newPassword.length < 8}
              className="btn btn-md btn-primary"
            >
              {submitting ? 'Envoi…' : 'Confirmer la réinitialisation'}
            </button>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-bg-border">
          <div className="text-sm font-bold">Sessions récentes</div>
          <div className="text-xs text-ink-muted">50 dernières connexions</div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Appareil</th>
                <th>IP</th>
                <th>Dernière activité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-ink-muted">
                    Aucune session
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.token}>
                    <td>
                      <div className="text-sm font-semibold">
                        {s.deviceName || '—'}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {s.deviceType}
                      </div>
                    </td>
                    <td className="text-xs font-mono">{s.ipAddress}</td>
                    <td className="text-ink-muted text-xs">
                      {new Date(s.lastActivityAt).toLocaleString('fr-FR')}
                    </td>
                    <td>
                      <span
                        className={
                          s.isRevoked ? 'badge-danger' : 'badge-success'
                        }
                      >
                        {s.isRevoked ? 'RÉVOQUÉE' : 'ACTIVE'}
                      </span>
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

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-dim">
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
