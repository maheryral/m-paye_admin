import { CableCar, Construction } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function Telepherique() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={CableCar}
        title="Téléphérique"
        subtitle="Gestion des lignes, cabines et trajets par câble"
      />

      <div className="card p-10">
        <EmptyState
          icon={Construction}
          title="Module en préparation"
          description="La gestion du téléphérique sera bientôt disponible. Cet espace est réservé pour les lignes, stations et réservations de cabines."
        />
      </div>
    </div>
  );
}
