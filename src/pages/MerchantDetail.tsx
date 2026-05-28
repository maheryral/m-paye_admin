import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  MapPin,
} from 'lucide-react';
import { merchantsAdminApi } from '../services/superAdminApi';

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<
    'approve' | 'reject' | 'suspend' | 'reactivate' | null
  >(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await merchantsAdminApi.getOne(id);
      setM(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run() {
    if (!id || !action) return;
    setErr(null);
    setBusy(true);
    try {
      if (action === 'approve') {
        await merchantsAdminApi.approve(id);
        setMsg('Marchand approuvé');
      } else if (action === 'reactivate') {
        await merchantsAdminApi.reactivate(id);
        setMsg('Marchand réactivé');
      } else {
        if (reason.trim().length < 5) {
          setErr('Motif requis (5 caractères min)');
          setBusy(false);
          return;
        }
        if (action === 'reject') {
          await merchantsAdminApi.reject(id, reason);
          setMsg('Marchand refusé');
        } else {
          await merchantsAdminApi.suspend(id, reason);
          setMsg('Marchand suspendu');
        }
      }
      setAction(null);
      setReason('');
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!m) return <div className="text-sm text-danger-400">Introuvable</div>;

  return (
    <div className="animate-fade-in max-w-5xl">
      <Link
        to="/merchants"
        className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Retour aux marchands
      </Link>

      {msg && (
        <div className="card p-3 mb-4 bg-success-bg border-success-500/30 text-sm text-success-400">
          {msg}
        </div>
      )}

      {/* Identité */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand-soft border border-brand-500/20 flex items-center justify-center">
              <Store size={28} className="text-brand-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{m.nom}</h1>
              <div className="text-sm text-ink-muted">{m.categorie}</div>
              {m.description && (
                <div className="text-sm text-ink-muted mt-2 max-w-2xl">
                  {m.description}
                </div>
              )}
            </div>
          </div>
          <div className="text-right space-y-2">
            <div>
              <span
                className={
                  m.validationStatus === 'APPROVED'
                    ? 'badge-success'
                    : m.validationStatus === 'PENDING'
                      ? 'badge-warning'
                      : m.validationStatus === 'REJECTED'
                        ? 'badge-danger'
                        : 'badge-info'
                }
              >
                {m.validationStatus}
              </span>
            </div>
            <div>
              <span className={m.isActive ? 'badge-success' : 'badge-danger'}>
                {m.isActive ? 'ACTIF' : 'SUSPENDU'}
              </span>
            </div>
          </div>
        </div>

        {m.rejectionReason && (
          <div className="text-sm text-danger-400 bg-danger-bg p-3 rounded-xl mb-4">
            <span className="font-bold">Motif :</span> {m.rejectionReason}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-bg-border">
          <Stat label="Boutiques" value={m._count?.stores ?? 0} />
          <Stat label="Coupons" value={m._count?.coupons ?? 0} />
          <Stat label="Transactions" value={m._count?.transactions ?? 0} />
          <Stat label="Refunds" value={m._count?.refunds ?? 0} />
        </div>

        {/* Coordonnées + utilisateur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-bg-border">
          <div>
            <div className="text-xs text-ink-dim mb-2 uppercase tracking-wider font-bold">
              Coordonnées
            </div>
            <div className="text-sm space-y-1">
              <div>{m.email || '—'}</div>
              <div>{m.phone || '—'}</div>
              <div className="text-ink-muted">{m.address || '—'}</div>
              {m.website && (
                <a
                  href={m.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-300 hover:underline"
                >
                  {m.website}
                </a>
              )}
              {m.registrationNumber && (
                <div className="text-xs font-mono text-ink-dim">
                  RCS : {m.registrationNumber}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-dim mb-2 uppercase tracking-wider font-bold">
              Propriétaire
            </div>
            <Link
              to={`/users/${m.user?.id}`}
              className="text-sm font-semibold hover:text-brand-300"
            >
              {m.user?.prenom} {m.user?.nom}
            </Link>
            <div className="text-xs text-ink-muted">{m.user?.email}</div>
            <div className="text-xs text-ink-muted">{m.user?.telephone}</div>
          </div>
        </div>
      </div>

      {/* Stats financières */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-dim">
            Volume traité
          </div>
          <div className="text-2xl font-bold mt-1">
            {Number(m.aggregates.revenueVolume).toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            {m.aggregates.successfulTransactions} transactions succès
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-dim">
            Frais collectés
          </div>
          <div className="text-2xl font-bold mt-1">
            {Number(m.aggregates.feesCollected).toLocaleString('fr-FR')}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-dim">
            Wallet
          </div>
          <div className="text-2xl font-bold mt-1">
            {m.wallet
              ? Number(m.wallet.soldeDisponible).toLocaleString('fr-FR')
              : '—'}
          </div>
          {m.wallet && (
            <div className="text-xs text-ink-muted mt-1">{m.wallet.devise}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6 mb-6">
        <div className="text-sm font-bold mb-3">Actions administratives</div>
        <div className="flex flex-wrap gap-2">
          {m.validationStatus === 'PENDING' && (
            <>
              <button
                onClick={() => setAction('approve')}
                className="btn btn-md btn-success"
              >
                <CheckCircle2 size={14} /> Approuver
              </button>
              <button
                onClick={() => setAction('reject')}
                className="btn btn-md btn-danger"
              >
                <XCircle size={14} /> Refuser
              </button>
            </>
          )}
          {m.validationStatus === 'APPROVED' && m.isActive && (
            <button
              onClick={() => setAction('suspend')}
              className="btn btn-md btn-danger"
            >
              <PauseCircle size={14} /> Suspendre
            </button>
          )}
          {m.validationStatus === 'APPROVED' && !m.isActive && (
            <button
              onClick={() => setAction('reactivate')}
              className="btn btn-md btn-success"
            >
              <PlayCircle size={14} /> Réactiver
            </button>
          )}
        </div>

        {action && (
          <div className="mt-4 bg-bg-elevated rounded-xl p-4 space-y-3">
            <div className="text-sm font-bold capitalize">
              {action === 'approve'
                ? 'Confirmer l\'approbation'
                : action === 'reactivate'
                  ? 'Confirmer la réactivation'
                  : `Confirmer ${action === 'reject' ? 'le refus' : 'la suspension'}`}
            </div>
            {(action === 'reject' || action === 'suspend') && (
              <textarea
                className="input min-h-[80px]"
                placeholder="Motif (obligatoire)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
            {err && (
              <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
                {err}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setAction(null);
                  setReason('');
                }}
                className="btn btn-md btn-ghost"
              >
                Annuler
              </button>
              <button
                onClick={run}
                disabled={busy}
                className={`btn btn-md ${
                  action === 'reject' || action === 'suspend'
                    ? 'btn-danger'
                    : 'btn-success'
                }`}
              >
                {busy ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Boutiques */}
      {m.stores?.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-bg-border">
            <div className="text-sm font-bold flex items-center gap-2">
              <MapPin size={14} /> Boutiques ({m._count?.stores})
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Ville</th>
                  <th>État</th>
                  <th>Créée le</th>
                </tr>
              </thead>
              <tbody>
                {m.stores.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.name}</td>
                    <td className="text-ink-muted">{s.city || '—'}</td>
                    <td>
                      <span
                        className={s.isActive ? 'badge-success' : 'badge-danger'}
                      >
                        {s.isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions récentes */}
      {m.recentTransactions?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-bg-border">
            <div className="text-sm font-bold">
              Dernières transactions ({m._count?.transactions} au total)
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {m.recentTransactions.map((t: any) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs">{t.reference}</td>
                    <td>{t.type}</td>
                    <td className="font-bold">
                      {Number(t.montant).toLocaleString('fr-FR')} {t.devise}
                    </td>
                    <td>
                      <span
                        className={
                          t.statut === 'SUCCESS'
                            ? 'badge-success'
                            : t.statut === 'FAILED'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }
                      >
                        {t.statut}
                      </span>
                    </td>
                    <td className="text-ink-muted text-xs">
                      {new Date(t.date).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
