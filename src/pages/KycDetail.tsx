import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ScanFace,
} from 'lucide-react';
import { kycAdminApi } from '../services/superAdminApi';

interface KycDoc {
  id: string;
  type: string;
  url: string;
  label?: string | null;
  status: string;
  uploadedAt: string;
  verified: boolean;
}
interface KycDetail {
  id: string;
  level: string;
  status: string;
  rejectionReason?: string | null;
  submittedAt: string;
  decidedAt?: string | null;
  livenessStatus?: string | null;
  livenessSequence?: string | null;
  user: any;
  documents: KycDoc[];
}

export default function KycDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await kycAdminApi.getOne(id);
        setKyc(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function submit() {
    if (!id || !action) return;
    setErr(null);
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await kycAdminApi.approve(id, note || undefined);
      } else {
        if (note.trim().length < 5) {
          setErr('Motif de refus requis (5 caractères min)');
          setSubmitting(false);
          return;
        }
        await kycAdminApi.reject(id, note);
      }
      navigate('/kyc');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur lors de l\'action');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!kyc) return <div className="text-sm text-danger-400">Introuvable</div>;

  const isPending = kyc.status === 'PENDING';

  return (
    <div className="animate-fade-in">
      <Link
        to="/kyc"
        className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Retour à la liste
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-dim">
              Demande KYC
            </div>
            <h1 className="text-2xl font-bold mt-1">
              {kyc.user.prenom} {kyc.user.nom}
            </h1>
            <div className="text-sm text-ink-muted mt-1">{kyc.user.email}</div>
            <div className="text-sm text-ink-muted">{kyc.user.telephone}</div>
          </div>
          <div className="text-right">
            <span
              className={
                kyc.status === 'PENDING'
                  ? 'badge-warning'
                  : kyc.status === 'APPROVED'
                    ? 'badge-success'
                    : 'badge-danger'
              }
            >
              {kyc.status}
            </span>
            <div className="text-xs text-ink-muted mt-2">
              Niveau demandé : <span className="font-bold">{kyc.level}</span>
            </div>
            <div className="text-xs text-ink-dim mt-1">
              Soumis le {new Date(kyc.submittedAt).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>

        {kyc.rejectionReason && (
          <div className="text-sm text-ink-muted bg-bg-elevated rounded-xl p-3 mb-4">
            <span className="text-ink-dim">Note précédente : </span>
            {kyc.rejectionReason}
          </div>
        )}

        {/* Vérification du visage (liveness) */}
        {(() => {
          const DIR_LABEL: Record<string, string> = {
            liveness_front: 'Face',
            liveness_right: 'Droite',
            liveness_left: 'Gauche',
            liveness_up: 'Haut',
            liveness_down: 'Bas',
          };
          const frames = kyc.documents.filter((d: any) =>
            (d.label || '').startsWith('liveness_'),
          );
          const otherDocs = kyc.documents.filter(
            (d: any) => !(d.label || '').startsWith('liveness_'),
          );
          const ls = kyc.livenessStatus as string | undefined;
          const lsTone =
            ls === 'PASSED'
              ? 'badge-success'
              : ls === 'FAILED'
                ? 'badge-danger'
                : ls === 'PENDING'
                  ? 'badge-warning'
                  : 'badge-info';
          return (
            <>
              {frames.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm font-bold mb-3 flex items-center gap-2">
                    <ScanFace size={16} /> Vérification du visage
                    {ls && <span className={lsTone}>{ls}</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {frames
                      .slice()
                      .sort((a: any, b: any) =>
                        (a.label || '').localeCompare(b.label || ''),
                      )
                      .map((d: any) => (
                        <a
                          key={d.id}
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="card overflow-hidden group"
                          title="Ouvrir l'image"
                        >
                          <img
                            src={d.url}
                            alt={d.label}
                            className="w-full h-32 object-cover bg-bg-elevated"
                          />
                          <div className="px-2 py-1.5 text-xs font-semibold text-center">
                            {DIR_LABEL[d.label] || d.label}
                          </div>
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* Documents (hors frames liveness) */}
              <div>
                <div className="text-sm font-bold mb-3 flex items-center gap-2">
                  <FileText size={16} /> Documents fournis ({otherDocs.length})
                </div>
                {otherDocs.length === 0 ? (
                  <div className="text-sm text-ink-muted">Aucun document</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {otherDocs.map((d: any) => (
                      <a
                        key={d.id}
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="card-interactive p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-semibold">{d.type}</div>
                          <div className="text-xs text-ink-muted">
                            {new Date(d.uploadedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-ink-dim" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* Action panel */}
      {isPending && (
        <div className="card p-6">
          <div className="text-sm font-bold mb-3">Décision</div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAction('approve')}
              className={`btn btn-md ${action === 'approve' ? 'btn-success' : 'btn-secondary'}`}
            >
              <CheckCircle2 size={16} /> Approuver
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`btn btn-md ${action === 'reject' ? 'btn-danger' : 'btn-secondary'}`}
            >
              <XCircle size={16} /> Refuser
            </button>
          </div>

          {action && (
            <div className="space-y-3">
              <div>
                <label className="label">
                  {action === 'reject'
                    ? 'Motif de refus (obligatoire, min. 5 caractères)'
                    : 'Note interne (optionnelle)'}
                </label>
                <textarea
                  className="input min-h-[80px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    action === 'reject'
                      ? 'Ex: Document illisible, pièce expirée…'
                      : 'Note libre'
                  }
                />
              </div>
              {err && (
                <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
                  {err}
                </div>
              )}
              <button
                onClick={submit}
                disabled={submitting}
                className={`btn btn-md ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
              >
                {submitting
                  ? 'Envoi…'
                  : action === 'approve'
                    ? 'Confirmer l\'approbation'
                    : 'Confirmer le refus'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
