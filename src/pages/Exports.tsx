import { useState } from 'react';
import { Download, Users, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { exportsApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Exports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function dl(kind: 'users' | 'transactions' | 'revenue') {
    setBusy(kind);
    try {
      const stamp = Date.now();
      if (kind === 'users') {
        const blob = await exportsApi.users();
        downloadBlob(blob, `users-${stamp}.csv`);
      } else if (kind === 'transactions') {
        const blob = await exportsApi.transactions({
          from: from || undefined,
          to: to || undefined,
        });
        downloadBlob(blob, `transactions-${stamp}.csv`);
      } else {
        const blob = await exportsApi.revenue({
          from: from || undefined,
          to: to || undefined,
        });
        downloadBlob(blob, `revenue-${stamp}.csv`);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Download}
        title="Exports CSV"
        subtitle="Téléchargements à des fins comptables et analytiques"
      />

      <div className="card p-6">
        <div className="text-sm font-bold mb-3">
          Plage de dates (pour transactions & revenus)
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Du</label>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Au</label>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ExportCard
          icon={Users}
          title="Utilisateurs"
          desc="Liste complète des comptes (sans mot de passe)"
          onClick={() => dl('users')}
          busy={busy === 'users'}
        />
        <ExportCard
          icon={ArrowLeftRight}
          title="Transactions"
          desc="Jusqu'à 50 000 dernières opérations"
          onClick={() => dl('transactions')}
          busy={busy === 'transactions'}
        />
        <ExportCard
          icon={TrendingUp}
          title="Revenus plateforme"
          desc="Détail des prélèvements (fees)"
          onClick={() => dl('revenue')}
          busy={busy === 'revenue'}
        />
      </div>
    </div>
  );
}

function ExportCard({
  icon: Icon,
  title,
  desc,
  onClick,
  busy,
}: {
  icon: any;
  title: string;
  desc: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="card-interactive p-5 text-left flex flex-col items-start gap-2 disabled:opacity-50"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div className="text-base font-bold">{title}</div>
      <div className="text-xs text-ink-muted">{desc}</div>
      <div className="text-xs text-brand-300 mt-2 flex items-center gap-1">
        {busy ? 'Téléchargement…' : 'Télécharger CSV'}
      </div>
    </button>
  );
}
