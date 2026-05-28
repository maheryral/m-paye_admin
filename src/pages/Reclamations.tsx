import { useEffect, useState } from 'react';
import { MessagesSquare, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';
import { reclamationsAdminApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';
import StatPill from '../components/ui/StatPill';
import EmptyState from '../components/ui/EmptyState';

interface Reclamation {
  id: string;
  sujet: string;
  description: string;
  statut: string;
  dateSoumission: string;
  user: { id: string; nom: string; prenom: string; email: string };
  voyage: {
    id: string;
    villeDepart: string;
    villeArrivee: string;
    dateDepart: string;
  };
}

export default function Reclamations() {
  const [statut, setStatut] = useState('en_attente');
  const [items, setItems] = useState<Reclamation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        reclamationsAdminApi.list({ statut, page: 1, limit: 50 }),
        reclamationsAdminApi.stats(),
      ]);
      setItems(list.items);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut]);

  async function change(id: string, newStatut: string) {
    await reclamationsAdminApi.updateStatut(id, newStatut);
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={MessagesSquare}
        title="Réclamations (transport)"
        subtitle="Modération des plaintes voyageurs taxi-brousse / téléphérique"
      />

      {/* Stats cliquables */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill
          icon={Clock}
          label="En attente"
          value={stats?.en_attente ?? 0}
          tone="warning"
          active={statut === 'en_attente'}
          onClick={() => setStatut('en_attente')}
        />
        <StatPill
          icon={CheckCheck}
          label="Traitées"
          value={stats?.traitee ?? 0}
          tone="brand"
          active={statut === 'traitee'}
          onClick={() => setStatut('traitee')}
        />
        <StatPill
          icon={CheckCircle2}
          label="Résolues"
          value={stats?.resolue ?? 0}
          tone="success"
          active={statut === 'resolue'}
          onClick={() => setStatut('resolue')}
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-4 w-40 mb-2" />
                <div className="skeleton h-3 w-60 mb-3" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            ))}
          </>
        ) : items.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={MessagesSquare}
              title="Aucune réclamation"
              description={
                statut === 'en_attente'
                  ? 'Tout est résolu — bon travail !'
                  : 'Aucune réclamation dans cette catégorie.'
              }
            />
          </div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-base font-bold">{r.sujet}</div>
                  <div className="text-xs text-ink-muted">
                    {r.user.prenom} {r.user.nom} ({r.user.email})
                  </div>
                </div>
                <span
                  className={
                    r.statut === 'en_attente'
                      ? 'badge-warning'
                      : r.statut === 'traitee'
                        ? 'badge-info'
                        : 'badge-success'
                  }
                >
                  {r.statut}
                </span>
              </div>

              <div className="text-xs text-ink-dim mb-3">
                Voyage : {r.voyage.villeDepart} → {r.voyage.villeArrivee} ·{' '}
                {new Date(r.voyage.dateDepart).toLocaleDateString('fr-FR')}
                {' · '}
                Soumis le{' '}
                {new Date(r.dateSoumission).toLocaleString('fr-FR')}
              </div>

              <div
                className={`text-sm text-ink ${open === r.id ? '' : 'line-clamp-2'} cursor-pointer`}
                onClick={() => setOpen(open === r.id ? null : r.id)}
              >
                {r.description}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-bg-border">
                {r.statut === 'en_attente' && (
                  <button
                    onClick={() => change(r.id, 'traitee')}
                    className="btn btn-sm btn-secondary"
                  >
                    <Clock size={12} /> Marquer "traitée"
                  </button>
                )}
                {r.statut !== 'resolue' && (
                  <button
                    onClick={() => change(r.id, 'resolue')}
                    className="btn btn-sm btn-success"
                  >
                    <CheckCheck size={12} /> Résoudre
                  </button>
                )}
                {r.statut === 'resolue' && (
                  <button
                    onClick={() => change(r.id, 'en_attente')}
                    className="btn btn-sm btn-ghost"
                  >
                    Rouvrir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
