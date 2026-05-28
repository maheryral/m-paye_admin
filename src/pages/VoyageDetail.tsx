import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Route,
  Car,
  UserCog,
  Users,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  XOctagon,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { transportApi } from '../services/superAdminApi';
import SeatMapView from '../components/SeatMapView';

export default function VoyageDetail() {
  const { id } = useParams<{ id: string }>();
  const [voyage, setVoyage] = useState<any>(null);
  const [places, setPlaces] = useState<any>(null);
  const [seatData, setSeatData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [v, p, sd] = await Promise.all([
        transportApi.getVoyage(id),
        transportApi.getPlaces(id),
        transportApi.getVoyageLayout(id).catch(() => null),
      ]);
      setVoyage(v);
      setPlaces(p);
      setSeatData(sd);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cancel() {
    if (!id) return;
    const reason = prompt('Motif d\'annulation (min. 5 caractères) :');
    if (!reason || reason.trim().length < 5) return;
    try {
      const res = await transportApi.cancelVoyage(id, reason);
      alert(
        `Voyage annulé. ${res.refundsTriggered} remboursements déclenchés.`,
      );
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }

  async function refundReservation(rid: string) {
    const reason = prompt('Motif du remboursement :');
    if (!reason || reason.trim().length < 3) return;
    try {
      await transportApi.refundReservation(rid, reason);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!voyage) return <div className="text-sm text-danger-400">Introuvable</div>;

  return (
    <div className="animate-fade-in">
      <Link
        to="/transport"
        className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Retour aux voyages
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-dim flex items-center gap-1">
              <Route size={12} /> Voyage
            </div>
            <h1 className="text-2xl font-bold mt-1">
              {voyage.villeDepart} → {voyage.villeArrivee}
            </h1>
            <div className="text-sm text-ink-muted mt-1 flex gap-3">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(voyage.dateDepart).toLocaleDateString('fr-FR')}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {voyage.heureDepart} → {voyage.heureArrivee}
              </span>
              {voyage.distanceKm && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {voyage.distanceKm} km
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={
                voyage.statut === 'termine'
                  ? 'badge-success'
                  : voyage.statut === 'annule'
                    ? 'badge-danger'
                    : voyage.statut === 'en_cours'
                      ? 'badge-warning'
                      : 'badge-info'
              }
            >
              {voyage.statut}
            </span>
            <div className="text-2xl font-bold mt-2">
              {Number(voyage.prix).toLocaleString('fr-FR')}
            </div>
            <div className="text-xs text-ink-muted">prix de base</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-bg-border">
          <Info icon={Car} label="Voiture" value={voyage.voiture?.matricule}>
            <div className="text-xs text-ink-muted">
              {voyage.voiture?.marque} {voyage.voiture?.modele} ·{' '}
              {voyage.voiture?.capacite} places
            </div>
          </Info>
          <Info
            icon={UserCog}
            label="Chauffeur"
            value={`${voyage.chauffeur?.prenom} ${voyage.chauffeur?.nom}`}
          >
            <div className="text-xs text-ink-muted">
              Permis : {voyage.chauffeur?.numeroPermis}
            </div>
          </Info>
          <Info
            icon={MapPin}
            label="Coopérative"
            value={voyage.cooperative?.nom}
          />
          <Info icon={Users} label="Classe" value={voyage.classe?.type}>
            <div className="text-xs text-ink-muted">
              ×{voyage.classe?.coefficientPrix}
            </div>
          </Info>
        </div>

        {voyage.statut !== 'annule' && voyage.statut !== 'termine' && (
          <div className="mt-4 pt-4 border-t border-bg-border">
            <button onClick={cancel} className="btn btn-md btn-danger">
              <XOctagon size={14} /> Annuler le voyage (rembourse les
              passagers)
            </button>
          </div>
        )}
      </div>

      {/* Places */}
      {places?.stats && (
        <div className="card p-5 mb-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users size={14} /> Occupation des places
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3">
              <div className="text-[10px] text-ink-dim">Réservées</div>
              <div className="text-2xl font-bold text-brand-300">
                {places.stats.placeReservee}
              </div>
            </div>
            <div className="card p-3">
              <div className="text-[10px] text-ink-dim">Bloquées</div>
              <div className="text-2xl font-bold text-warning-500">
                {places.stats.placeBloquee}
              </div>
            </div>
            <div className="card p-3">
              <div className="text-[10px] text-ink-dim">Libres</div>
              <div className="text-2xl font-bold text-success-500">
                {places.stats.placeLibre}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan visuel des sièges */}
      {seatData?.layout && (
        <div className="card p-5 mb-4 overflow-auto">
          <div className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users size={14} /> Plan du véhicule (sièges en temps réel)
          </div>
          <div className="flex justify-center">
            <SeatMapView
              layout={seatData.layout}
              seatMap={seatData.seatMap}
              seatToReservation={seatData.seatToReservation}
            />
          </div>
        </div>
      )}

      {/* Réservations */}
      <div className="card overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <div className="text-sm font-bold">
            Passagers ({voyage.reservations?.length ?? 0})
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Place</th>
                <th>Passager</th>
                <th>Code</th>
                <th>Prix payé</th>
                <th>Réservation</th>
                <th>Paiement</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {voyage.reservations?.map((r: any) => (
                <tr key={r.id}>
                  <td className="text-center font-bold text-lg">
                    {r.numPlace}
                  </td>
                  <td>
                    <div className="font-semibold">
                      {r.user?.prenom} {r.user?.nom}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {r.user?.telephone}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{r.codeConfirmation}</td>
                  <td className="font-bold">
                    {Number(r.prixPaye).toLocaleString('fr-FR')}
                  </td>
                  <td>
                    <span
                      className={
                        r.statusReservation === 'confirmée'
                          ? 'badge-success'
                          : r.statusReservation === 'annulee'
                            ? 'badge-danger'
                            : 'badge-warning'
                      }
                    >
                      {r.statusReservation}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        r.statusPaiement === 'paye'
                          ? 'badge-success'
                          : r.statusPaiement === 'rembourse'
                            ? 'badge-info'
                            : 'badge-warning'
                      }
                    >
                      {r.statusPaiement}
                    </span>
                  </td>
                  <td>
                    {r.statusPaiement === 'paye' && (
                      <button
                        onClick={() => refundReservation(r.id)}
                        className="btn btn-sm btn-secondary"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(voyage.reservations ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-ink-muted">
                    Aucune réservation
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Réclamations liées */}
      {voyage.reclamations?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning-500" />
            <div className="text-sm font-bold">
              Réclamations ({voyage.reclamations.length})
            </div>
          </div>
          {voyage.reclamations.map((r: any) => (
            <div key={r.id} className="p-4 border-b border-bg-border last:border-0">
              <div className="flex items-start justify-between mb-1">
                <div className="font-semibold">{r.sujet}</div>
                <span
                  className={
                    r.statut === 'resolue'
                      ? 'badge-success'
                      : r.statut === 'traitee'
                        ? 'badge-info'
                        : 'badge-warning'
                  }
                >
                  {r.statut}
                </span>
              </div>
              <div className="text-xs text-ink-muted mb-2">
                Par {r.user?.prenom} {r.user?.nom} —{' '}
                {new Date(r.dateSoumission).toLocaleString('fr-FR')}
              </div>
              <div className="text-sm">{r.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: any;
  label: string;
  value: any;
  children?: any;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-dim flex items-center gap-1">
        <Icon size={10} /> {label}
      </div>
      <div className="font-semibold text-sm mt-1">{value ?? '—'}</div>
      {children}
    </div>
  );
}
