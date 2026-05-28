import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Armchair,
  Wind,
  Footprints,
  DoorOpen,
  UserCog,
  Square,
  Toilet,
  Accessibility,
  Crown,
  Save,
  Plus,
  Minus,
  Layers,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { transportApi } from '../services/superAdminApi';

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

const TOOLS: {
  type: CellType;
  label: string;
  icon: any;
  color: string;
  countable: boolean;
}[] = [
  { type: 'seat', label: 'Siège', icon: Armchair, color: 'bg-brand-500/30 text-brand-200 border-brand-500/50', countable: true },
  { type: 'window_seat', label: 'Siège fenêtre', icon: Wind, color: 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50', countable: true },
  { type: 'vip_seat', label: 'Siège VIP', icon: Crown, color: 'bg-purple-500/30 text-purple-200 border-purple-500/50', countable: true },
  { type: 'accessible_seat', label: 'PMR', icon: Accessibility, color: 'bg-success-bg text-success-500 border-success-500/50', countable: true },
  { type: 'aisle', label: 'Couloir', icon: Footprints, color: 'bg-bg-elevated text-ink-muted border-bg-border', countable: false },
  { type: 'door', label: 'Porte', icon: DoorOpen, color: 'bg-warning-bg text-warning-500 border-warning-500/50', countable: false },
  { type: 'driver', label: 'Chauffeur', icon: UserCog, color: 'bg-danger-bg text-danger-400 border-danger-500/50', countable: false },
  { type: 'wc', label: 'WC', icon: Toilet, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', countable: false },
  { type: 'empty', label: 'Vide', icon: Square, color: 'bg-transparent text-ink-dim border-bg-border/40 border-dashed', countable: false },
];

function defaultDeck(deckNumber = 1, rows = 8, cols = 5): Deck {
  // Layout par défaut : 2 sièges + couloir + 2 sièges, sauf la 1ère ligne chauffeur+porte
  const grid: CellType[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellType[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === 0) row.push('driver');
      else if (r === 0 && c === cols - 1) row.push('door');
      else if (r === 0) row.push('empty');
      else if (c === 0 || c === cols - 1) row.push('window_seat');
      else if (c === Math.floor(cols / 2)) row.push('aisle');
      else row.push('seat');
    }
    grid.push(row);
  }
  return { deckNumber, name: deckNumber === 1 ? 'Bas' : `Étage ${deckNumber}`, grid };
}

export function SeatPlanEditor({
  voitureId,
  embedded = false,
  onSaved,
}: {
  voitureId: string;
  embedded?: boolean;
  onSaved?: (totalSeats: number) => void;
}) {
  const id = voitureId;
  const [voiture, setVoiture] = useState<any>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [activeDeck, setActiveDeck] = useState(0);
  const [tool, setTool] = useState<CellType>('seat');
  const [paintMode, setPaintMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      const data = await transportApi.getLayout(id);
      setVoiture(data.voiture);
      if (data.layout?.decks?.length) {
        setLayout(data.layout);
      } else {
        // Initialise avec un layout par défaut
        setLayout({ decks: [defaultDeck(1, 8, 5)] });
        setDirty(true);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur de chargement');
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Compteur de sièges en temps réel
  const seatCount = useMemo(() => {
    if (!layout) return 0;
    const countable = new Set(['seat', 'window_seat', 'vip_seat', 'accessible_seat']);
    let n = 0;
    for (const deck of layout.decks) {
      for (const row of deck.grid) {
        for (const c of row) {
          if (countable.has(c)) n++;
        }
      }
    }
    return n;
  }, [layout]);

  const seatNumbering = useMemo(() => {
    if (!layout) return {};
    const countable = new Set(['seat', 'window_seat', 'vip_seat', 'accessible_seat']);
    const map: Record<string, number> = {};
    let n = 1;
    for (const deck of [...layout.decks].sort((a, b) => a.deckNumber - b.deckNumber)) {
      for (let r = 0; r < deck.grid.length; r++) {
        for (let c = 0; c < deck.grid[r].length; c++) {
          if (countable.has(deck.grid[r][c])) {
            map[`${deck.deckNumber}-${r}-${c}`] = n++;
          }
        }
      }
    }
    return map;
  }, [layout]);

  function setCell(deckIdx: number, r: number, c: number, type: CellType) {
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      next.decks[deckIdx].grid[r][c] = type;
      return next;
    });
    setDirty(true);
  }

  function clickCell(r: number, c: number) {
    setCell(activeDeck, r, c, tool);
  }

  function dragCell(r: number, c: number) {
    if (!paintMode) return;
    setCell(activeDeck, r, c, tool);
  }

  function addRow() {
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      const cols = next.decks[activeDeck].grid[0]?.length ?? 5;
      next.decks[activeDeck].grid.push(Array(cols).fill('seat'));
      return next;
    });
    setDirty(true);
  }

  function removeRow() {
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      if (next.decks[activeDeck].grid.length > 1) {
        next.decks[activeDeck].grid.pop();
      }
      return next;
    });
    setDirty(true);
  }

  function addCol() {
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      next.decks[activeDeck].grid.forEach((row) => row.push('seat'));
      return next;
    });
    setDirty(true);
  }

  function removeCol() {
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      next.decks[activeDeck].grid.forEach((row) => {
        if (row.length > 1) row.pop();
      });
      return next;
    });
    setDirty(true);
  }

  function addDeck() {
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      const nextNum =
        Math.max(...next.decks.map((d) => d.deckNumber)) + 1;
      next.decks.push(defaultDeck(nextNum, 6, 5));
      return next;
    });
    setActiveDeck(layout!.decks.length);
    setDirty(true);
  }

  function removeActiveDeck() {
    if (!layout || layout.decks.length <= 1) return;
    if (!confirm(`Supprimer l'étage ${layout.decks[activeDeck].deckNumber} ?`)) return;
    setLayout((prev) => {
      if (!prev) return prev;
      const next: Layout = JSON.parse(JSON.stringify(prev));
      next.decks.splice(activeDeck, 1);
      return next;
    });
    setActiveDeck(0);
    setDirty(true);
  }

  function resetLayout() {
    if (!confirm('Réinitialiser le plan avec un modèle par défaut ?')) return;
    setLayout({ decks: [defaultDeck(1, 8, 5)] });
    setActiveDeck(0);
    setDirty(true);
  }

  async function save() {
    if (!id || !layout) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await transportApi.saveLayout(id, layout, true);
      setMsg(
        `Plan enregistré · ${res.totalSeats} places · Capacité mise à jour`,
      );
      setDirty(false);
      onSaved?.(res.totalSeats);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  if (!voiture) return <div className="text-sm text-ink-muted">Chargement…</div>;
  if (!layout) return null;

  const deck = layout.decks[activeDeck];
  const toolMeta = TOOLS.find((t) => t.type === tool)!;

  return (
    <div className="animate-fade-in">
      {!embedded && (
        <Link
          to="/transport"
          className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Retour aux voitures
        </Link>
      )}

      <div className="card p-5 mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Plan de places — {voiture.matricule}
          </h1>
          <div className="text-sm text-ink-muted mt-1">
            Capacité actuelle : <span className="font-bold">{voiture.capacite}</span> places ·{' '}
            Plan en cours : <span className="font-bold text-brand-300">{seatCount}</span> places
            {dirty && (
              <span className="ml-2 text-warning-500">● non sauvé</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetLayout}
            className="btn btn-md btn-ghost"
            title="Réinitialiser"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="btn btn-md btn-primary"
          >
            <Save size={14} /> Enregistrer
          </button>
        </div>
      </div>

      {msg && (
        <div className="card p-3 mb-4 bg-success-bg border-success-500/30 text-sm text-success-400">
          {msg}
        </div>
      )}
      {err && (
        <div className="card p-3 mb-4 bg-danger-bg border-danger-500/30 text-sm text-danger-400">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4">
        {/* Toolbar */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">
              Outil
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                const active = tool === t.type;
                return (
                  <button
                    key={t.type}
                    onClick={() => setTool(t.type)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs ${
                      active
                        ? 'border-brand-400 bg-brand-500/15 text-ink'
                        : 'border-bg-border text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Icon size={12} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-xs mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={paintMode}
                onChange={(e) => setPaintMode(e.target.checked)}
              />
              Mode pinceau (glisser pour peindre)
            </label>
          </div>

          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">
              Étages
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {layout.decks.map((d, i) => (
                <button
                  key={d.deckNumber}
                  onClick={() => setActiveDeck(i)}
                  className={`btn btn-sm ${
                    activeDeck === i ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {d.name ?? `Étage ${d.deckNumber}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addDeck}
                className="btn btn-sm btn-secondary"
                title="Ajouter un étage"
              >
                <Layers size={12} /> Ajouter
              </button>
              {layout.decks.length > 1 && (
                <button
                  onClick={removeActiveDeck}
                  className="btn btn-sm btn-ghost text-danger-400"
                  title="Supprimer cet étage"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">
              Dimensions ({deck.grid.length}×{deck.grid[0]?.length ?? 0})
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addRow} className="btn btn-sm btn-secondary">
                <Plus size={10} /> Ligne
              </button>
              <button onClick={removeRow} className="btn btn-sm btn-ghost">
                <Minus size={10} /> Ligne
              </button>
              <button onClick={addCol} className="btn btn-sm btn-secondary">
                <Plus size={10} /> Colonne
              </button>
              <button onClick={removeCol} className="btn btn-sm btn-ghost">
                <Minus size={10} /> Colonne
              </button>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">
              Aide
            </div>
            <ul className="text-xs text-ink-muted space-y-1">
              <li>
                <strong>Clic</strong> sur une cellule = appliquer l'outil
              </li>
              <li>
                <strong>Glisser</strong> en mode pinceau = peindre plusieurs
              </li>
              <li>Les sièges sont <strong>numérotés automatiquement</strong> de haut en bas, gauche → droite</li>
              <li>La capacité est <strong>recalculée à chaque save</strong></li>
            </ul>
          </div>
        </div>

        {/* Grille */}
        <div className="card p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold flex items-center gap-2">
              <Layers size={14} />
              {deck.name ?? `Étage ${deck.deckNumber}`}
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${toolMeta.color}`}
            >
              <toolMeta.icon size={12} />
              <span>Outil : {toolMeta.label}</span>
            </div>
          </div>

          <div className="flex justify-center">
          <div
            className="inline-block bg-bg-elevated/50 rounded-2xl p-4 select-none"
            onMouseLeave={() => {}}
          >
            <div className="grid gap-1.5" style={{
              gridTemplateColumns: `repeat(${deck.grid[0]?.length ?? 0}, 56px)`,
            }}>
              {deck.grid.map((row, r) =>
                row.map((cell, c) => {
                  const meta = TOOLS.find((t) => t.type === cell)!;
                  const Icon = meta.icon;
                  const seatNum = seatNumbering[`${deck.deckNumber}-${r}-${c}`];
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => clickCell(r, c)}
                      onMouseDown={() => clickCell(r, c)}
                      onMouseEnter={() => dragCell(r, c)}
                      className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-glow-soft ${meta.color}`}
                      title={`${meta.label}${seatNum ? ` (place ${seatNum})` : ''}`}
                    >
                      <Icon size={18} />
                      {seatNum && (
                        <div className="text-[10px] font-bold leading-none mt-0.5">
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

          <div className="mt-4 text-xs text-ink-muted text-center">
            Avant de la voiture = haut de la grille · Sièges numérotés en
            row-major
          </div>
        </div>
      </div>
    </div>
  );
}

// Page (route) : lit l'id depuis l'URL
export default function SeatLayoutEditor() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <SeatPlanEditor voitureId={id} />;
}
