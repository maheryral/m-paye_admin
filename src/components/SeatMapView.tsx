import {
  Armchair,
  Wind,
  Footprints,
  DoorOpen,
  UserCog,
  Square,
  Toilet,
  Accessibility,
  Crown,
} from 'lucide-react';

type CellType =
  | 'seat'
  | 'window_seat'
  | 'aisle'
  | 'door'
  | 'driver'
  | 'empty'
  | 'wc'
  | 'accessible_seat'
  | 'vip_seat';

interface Deck {
  deckNumber: number;
  name?: string;
  grid: CellType[][];
}
interface Layout {
  decks: Deck[];
}

const META: Record<
  CellType,
  { label: string; icon: any; baseColor: string; countable: boolean }
> = {
  seat: { label: 'Siège', icon: Armchair, baseColor: 'border-brand-500/40', countable: true },
  window_seat: { label: 'Siège fenêtre', icon: Wind, baseColor: 'border-cyan-500/40', countable: true },
  vip_seat: { label: 'Siège VIP', icon: Crown, baseColor: 'border-purple-500/40', countable: true },
  accessible_seat: { label: 'PMR', icon: Accessibility, baseColor: 'border-success-500/40', countable: true },
  aisle: { label: 'Couloir', icon: Footprints, baseColor: 'border-bg-border', countable: false },
  door: { label: 'Porte', icon: DoorOpen, baseColor: 'border-warning-500/40', countable: false },
  driver: { label: 'Chauffeur', icon: UserCog, baseColor: 'border-danger-500/40', countable: false },
  wc: { label: 'WC', icon: Toilet, baseColor: 'border-cyan-500/30', countable: false },
  empty: { label: 'Vide', icon: Square, baseColor: 'border-bg-border/40 border-dashed', countable: false },
};

interface Props {
  layout: Layout;
  /** map "deck-row-col" -> seatNumber (depuis backend) */
  seatMap?: Record<string, number>;
  /** map seatNumber -> reservation (depuis backend) */
  seatToReservation?: Record<number, any>;
  compact?: boolean;
}

export default function SeatMapView({
  layout,
  seatMap = {},
  seatToReservation = {},
  compact = false,
}: Props) {
  const size = compact ? 'w-10 h-10' : 'w-14 h-14';
  const iconSize = compact ? 14 : 18;

  return (
    <div className="space-y-6">
      {layout.decks.map((deck) => (
        <div key={deck.deckNumber}>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">
            {deck.name ?? `Étage ${deck.deckNumber}`}
          </div>
          <div className="inline-block bg-bg-elevated/50 rounded-2xl p-4">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${deck.grid[0]?.length ?? 0}, ${compact ? 40 : 56}px)`,
              }}
            >
              {deck.grid.map((row, r) =>
                row.map((cell, c) => {
                  const meta = META[cell];
                  const Icon = meta.icon;
                  const seatNum = seatMap[`${deck.deckNumber}-${r}-${c}`];
                  const reservation = seatNum
                    ? seatToReservation[seatNum]
                    : undefined;

                  // Couleur selon état réservation pour les sièges comptables
                  let bgColor = '';
                  if (meta.countable) {
                    if (reservation) {
                      if (
                        reservation.statusReservation === 'annulee' ||
                        reservation.statusPaiement === 'rembourse'
                      ) {
                        bgColor = 'bg-bg-elevated text-ink-dim';
                      } else if (reservation.statusPaiement === 'paye') {
                        bgColor = 'bg-success-bg text-success-500';
                      } else {
                        bgColor = 'bg-warning-bg text-warning-500';
                      }
                    } else {
                      bgColor = 'bg-brand-500/15 text-brand-300';
                    }
                  } else {
                    const colorMap: Record<string, string> = {
                      aisle: 'text-ink-muted',
                      door: 'bg-warning-bg/40 text-warning-500',
                      driver: 'bg-danger-bg/40 text-danger-400',
                      wc: 'bg-cyan-500/10 text-cyan-300',
                      empty: 'text-ink-dim',
                    };
                    bgColor = colorMap[cell] ?? '';
                  }

                  const title = reservation
                    ? `Place ${seatNum} · ${reservation.user?.prenom} ${reservation.user?.nom} · ${reservation.statusPaiement}`
                    : seatNum
                      ? `Place ${seatNum} (libre)`
                      : meta.label;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`${size} rounded-lg border flex flex-col items-center justify-center ${meta.baseColor} ${bgColor}`}
                      title={title}
                    >
                      <Icon size={iconSize} />
                      {seatNum && (
                        <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold leading-none mt-0.5`}>
                          {seatNum}
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Légende */}
      <div className="flex flex-wrap gap-3 text-xs text-ink-muted pt-2 border-t border-bg-border">
        <Legend bg="bg-success-bg" border="border-success-500/40" label="Payé" />
        <Legend bg="bg-warning-bg" border="border-warning-500/40" label="En attente" />
        <Legend bg="bg-brand-500/15" border="border-brand-500/40" label="Libre" />
        <Legend bg="bg-bg-elevated" border="border-bg-border" label="Annulé/remboursé" />
      </div>
    </div>
  );
}

function Legend({
  bg,
  border,
  label,
}: {
  bg: string;
  border: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-4 h-4 rounded border ${bg} ${border}`} />
      <span>{label}</span>
    </div>
  );
}
