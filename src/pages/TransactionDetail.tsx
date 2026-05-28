import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { transactionsAdminApi } from '../services/superAdminApi';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await transactionsAdminApi.getOne(id);
        setTx(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!tx) return <div className="text-sm text-danger-400">Introuvable</div>;

  const srcUser = tx.sourceWallet?.account?.user;
  const dstUser = tx.destinationWallet?.account?.user;

  return (
    <div className="animate-fade-in">
      <Link
        to="/transactions"
        className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Retour aux transactions
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-dim">
              {tx.type}
            </div>
            <div className="text-3xl font-bold mt-1">
              {Number(tx.montant).toLocaleString('fr-FR')} {tx.devise}
            </div>
            <div className="font-mono text-xs text-ink-muted mt-2">
              {tx.reference}
            </div>
          </div>
          <span
            className={
              tx.statut === 'SUCCESS'
                ? 'badge-success'
                : tx.statut === 'FAILED'
                  ? 'badge-danger'
                  : 'badge-warning'
            }
          >
            {tx.statut}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs text-ink-dim mb-1">Source</div>
            {srcUser ? (
              <div>
                <div className="font-semibold">
                  {srcUser.prenom} {srcUser.nom}
                </div>
                <div className="text-xs text-ink-muted">{srcUser.email}</div>
              </div>
            ) : (
              <div className="text-ink-muted text-sm">—</div>
            )}
          </div>
          <div>
            <div className="text-xs text-ink-dim mb-1">Destination</div>
            {tx.merchant ? (
              <div className="font-semibold">{tx.merchant.nom} (marchand)</div>
            ) : dstUser ? (
              <div>
                <div className="font-semibold">
                  {dstUser.prenom} {dstUser.nom}
                </div>
                <div className="text-xs text-ink-muted">{dstUser.email}</div>
              </div>
            ) : (
              <div className="text-ink-muted text-sm">—</div>
            )}
          </div>
          <div>
            <div className="text-xs text-ink-dim mb-1">Date</div>
            <div>{new Date(tx.date).toLocaleString('fr-FR')}</div>
          </div>
          <div>
            <div className="text-xs text-ink-dim mb-1">Frais</div>
            <div>
              {tx.feeAmount
                ? `${Number(tx.feeAmount).toLocaleString('fr-FR')} ${tx.devise}`
                : '—'}
            </div>
          </div>
          {tx.motif && (
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-dim mb-1">Motif</div>
              <div className="text-sm">{tx.motif}</div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
          <FileText size={16} />
          <span className="text-sm font-bold">Écritures comptables (ledger)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>Montant</th>
                <th>Référence</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {tx.ledger?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-ink-muted">
                    Aucune écriture
                  </td>
                </tr>
              ) : (
                tx.ledger?.map((l: any) => (
                  <tr key={l.id}>
                    <td>
                      <span
                        className={
                          l.type === 'DEBIT' ? 'badge-danger' : 'badge-success'
                        }
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="font-mono">
                      {Number(l.montant).toLocaleString('fr-FR')} {l.devise}
                    </td>
                    <td className="font-mono text-xs">{l.reference}</td>
                    <td className="text-ink-muted text-xs">
                      {new Date(l.date).toLocaleString('fr-FR')}
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
