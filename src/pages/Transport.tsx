import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Building2,
  UserCog,
  MapPinned,
  Tag,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  Car,
  Route,
  Ticket,
  CreditCard,
  Megaphone,
  History,
  Layers,
  Wrench,
  Eye,
  RotateCcw,
  XOctagon,
  Search,
} from 'lucide-react';
import { transportApi } from '../services/superAdminApi';
import MapPicker from '../components/ui/MapPicker';

type Tab =
  | 'stats'
  | 'cooperatives'
  | 'chauffeurs'
  | 'gares'
  | 'tarifs'
  | 'voitures'
  | 'maintenance'
  | 'classes'
  | 'voyages'
  | 'reservations'
  | 'paiements'
  | 'annonces'
  | 'historique';

export default function Transport() {
  const [tab, setTab] = useState<Tab>('stats');

  const TABS: { id: Tab; label: string; icon: any; group?: string }[] = [
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'cooperatives', label: 'Coopératives', icon: Building2 },
    { id: 'gares', label: 'Gares', icon: MapPinned },
    { id: 'voitures', label: 'Voitures', icon: Car },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'chauffeurs', label: 'Chauffeurs', icon: UserCog },
    { id: 'classes', label: 'Classes', icon: Layers },
    { id: 'tarifs', label: 'Tarifs', icon: Tag },
    { id: 'voyages', label: 'Voyages', icon: Route },
    { id: 'reservations', label: 'Réservations', icon: Ticket },
    { id: 'paiements', label: 'Paiements', icon: CreditCard },
    { id: 'annonces', label: 'Annonces', icon: Megaphone },
    { id: 'historique', label: 'Historique', icon: History },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bus size={22} className="text-brand-400" />
          Transport (Taxi-brousse / Téléphérique)
        </h1>
        <p className="text-sm text-ink-muted">
          Gestion complète de la flotte, voyages, réservations et paiements
        </p>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-bg-border overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-brand-400 text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'cooperatives' && <CoopsTab />}
      {tab === 'chauffeurs' && <ChauffeursTab />}
      {tab === 'gares' && <GaresTab />}
      {tab === 'tarifs' && <TarifsTab />}
      {tab === 'voitures' && <VoituresTab />}
      {tab === 'maintenance' && <MaintenanceTab />}
      {tab === 'classes' && <ClassesTab />}
      {tab === 'voyages' && <VoyagesTab />}
      {tab === 'reservations' && <ReservationsTab />}
      {tab === 'paiements' && <PaiementsTab />}
      {tab === 'annonces' && <AnnoncesTab />}
      {tab === 'historique' && <HistoriqueTab />}
    </div>
  );
}

function StatsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    transportApi.voyagesStats().then(setData);
  }, []);
  if (!data) return <div className="text-sm text-ink-muted">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Mini label="Planifiés" value={data.counts.planifies} tone="brand" />
        <Mini label="En cours" value={data.counts.encours} tone="warning" />
        <Mini label="Terminés" value={data.counts.termines} tone="success" />
        <Mini label="Annulés" value={data.counts.annules} tone="danger" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-bg-border">
          <div className="text-sm font-bold">
            Top 10 destinations (30 derniers jours)
          </div>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>De</th>
              <th>Vers</th>
              <th>Voyages</th>
            </tr>
          </thead>
          <tbody>
            {data.topRoutes.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-ink-muted">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              data.topRoutes.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="font-semibold">{r.from}</td>
                  <td>{r.to}</td>
                  <td className="font-bold">{r.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoopsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [gares, setGares] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    nom: '',
    telephone: '',
    email: '',
    siegeSocial: '',
    gareRoutiereId: '',
  });

  async function load() {
    const [l, g] = await Promise.all([
      transportApi.listCoops({ q: q || undefined }),
      transportApi.listGares(),
    ]);
    setItems(l.items);
    setGares(g);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await transportApi.upsertCoop(form);
      setShow(false);
      setForm({ nom: '', telephone: '', email: '', siegeSocial: '', gareRoutiereId: '' });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erreur enregistrement');
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette coopérative ?')) return;
    await transportApi.deleteCoop(id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nom</label>
              <input
                className="input"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Gare routière</label>
              <select
                className="input"
                value={form.gareRoutiereId}
                onChange={(e) =>
                  setForm({ ...form, gareRoutiereId: e.target.value })
                }
                required
              >
                <option value="">— Sélectionner —</option>
                {gares.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                className="input"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Siège social</label>
              <input
                className="input"
                value={form.siegeSocial}
                onChange={(e) => setForm({ ...form, siegeSocial: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Gare</th>
              <th>Contact</th>
              <th>Stats</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold">{c.nom}</td>
                <td className="text-ink-muted">{c.gareRoutiere?.nom ?? '—'}</td>
                <td className="text-xs">
                  <div>{c.telephone}</div>
                  <div className="text-ink-muted">{c.email}</div>
                </td>
                <td className="text-xs text-ink-muted">
                  {c._count?.voitures} voitures ·{' '}
                  {c._count?.voyages} voyages
                </td>
                <td>
                  <button
                    onClick={() => remove(c.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-ink-muted">
                  Aucune coopérative
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChauffeursTab() {
  const [items, setItems] = useState<any[]>([]);
  const [voitures, setVoitures] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    numeroPermis: '',
    dateEmbauche: '',
    statut: 'disponible',
    voitureId: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [l, v] = await Promise.all([
      transportApi.listChauffeurs({ q: q || undefined }),
      transportApi.listVoitures({ limit: 500 }),
    ]);
    setItems(l.items);
    setVoitures(v.items);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function setStatut(id: string, statut: string) {
    await transportApi.setChauffeurStatut(id, statut);
    load();
  }

  function openCreate() {
    setEditing(null);
    setForm({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      numeroPermis: '',
      dateEmbauche: '',
      statut: 'disponible',
      voitureId: '',
    });
    setErr(null);
    setShowForm(true);
  }

  function openEdit(c: any) {
    setEditing(c);
    setForm({
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone ?? '',
      email: c.email ?? '',
      numeroPermis: c.numeroPermis,
      dateEmbauche: c.dateEmbauche?.slice(0, 10) ?? '',
      statut: c.statut,
      voitureId: c.voitureId,
    });
    setErr(null);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await transportApi.upsertChauffeur(form);
      setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: any) {
    if (!confirm(`Supprimer le chauffeur ${c.prenom} ${c.nom} ?`)) return;
    try {
      await transportApi.deleteChauffeur(c.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur de suppression');
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Rechercher nom, permis…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={openCreate} className="btn btn-md btn-primary">
          <Plus size={14} /> Nouveau chauffeur
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Permis</th>
              <th>Coopérative</th>
              <th>Voiture</th>
              <th>Statut</th>
              <th>Voyages</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-semibold">
                    {c.prenom} {c.nom}
                  </div>
                  <div className="text-xs text-ink-muted">{c.telephone}</div>
                </td>
                <td className="font-mono text-xs">{c.numeroPermis}</td>
                <td className="text-ink-muted text-xs">
                  {c.voiture?.cooperative?.nom ?? '—'}
                </td>
                <td className="font-mono text-xs">
                  {c.voiture?.matricule ?? '—'}
                </td>
                <td>
                  <span
                    className={
                      c.statut === 'disponible'
                        ? 'badge-success'
                        : c.statut === 'suspendu'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }
                  >
                    {c.statut}
                  </span>
                </td>
                <td className="text-ink-muted">{c._count?.voyages}</td>
                <td className="space-x-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="btn btn-sm btn-ghost"
                    title="Éditer"
                  >
                    ✏️
                  </button>
                  {c.statut !== 'suspendu' ? (
                    <button
                      onClick={() => setStatut(c.id, 'suspendu')}
                      className="btn btn-sm btn-danger"
                    >
                      Suspendre
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatut(c.id, 'disponible')}
                      className="btn btn-sm btn-success"
                    >
                      Réactiver
                    </button>
                  )}
                  <button
                    onClick={() => remove(c)}
                    className="btn btn-sm btn-ghost text-danger-400"
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-ink-muted">
                  Aucun chauffeur
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-auto"
          onClick={() => !busy && setShowForm(false)}
        >
          <form
            onSubmit={save}
            className="card p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">
                {editing ? 'Éditer le chauffeur' : 'Nouveau chauffeur'}
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-sm btn-ghost"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input
                  className="input"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Nom</label>
                <input
                  className="input"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">N° permis de conduire</label>
                <input
                  className="input font-mono"
                  value={form.numeroPermis}
                  onChange={(e) =>
                    setForm({ ...form, numeroPermis: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  value={form.telephone}
                  onChange={(e) =>
                    setForm({ ...form, telephone: e.target.value })
                  }
                  placeholder="+261…"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Date d'embauche</label>
                <input
                  type="date"
                  className="input"
                  value={form.dateEmbauche}
                  onChange={(e) =>
                    setForm({ ...form, dateEmbauche: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Voiture assignée</label>
                <select
                  className="input"
                  value={form.voitureId}
                  onChange={(e) =>
                    setForm({ ...form, voitureId: e.target.value })
                  }
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {voitures.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} — {v.cooperative?.nom ?? ''} ({v.marque}{' '}
                      {v.modele})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={form.statut}
                  onChange={(e) =>
                    setForm({ ...form, statut: e.target.value })
                  }
                >
                  <option value="disponible">Disponible</option>
                  <option value="en_service">En service</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="retraite">Retraité</option>
                </select>
              </div>
            </div>

            {err && (
              <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
                {err}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-bg-border">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-md btn-ghost"
                disabled={busy}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn btn-md btn-primary"
              >
                <Save size={14} />{' '}
                {busy
                  ? 'Enregistrement…'
                  : editing
                    ? 'Mettre à jour'
                    : 'Créer le chauffeur'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function GaresTab() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    nom: '',
    localisation: '',
    telephone: '',
    capaciteQuotidienne: 0,
    horaireOuverture: '06:00',
    horaireFermeture: '20:00',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  async function load() {
    setItems(await transportApi.listGares());
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await transportApi.upsertGare(form);
      setShow(false);
      setForm({
        nom: '',
        localisation: '',
        telephone: '',
        capaciteQuotidienne: 0,
        horaireOuverture: '06:00',
        horaireFermeture: '20:00',
        latitude: null,
        longitude: null,
      });
      load();
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          'Échec de l\'enregistrement',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle gare
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nom</label>
              <input
                className="input"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Localisation</label>
              <input
                className="input"
                value={form.localisation}
                onChange={(e) =>
                  setForm({ ...form, localisation: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                className="input"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Capacité quotidienne</label>
              <input
                type="number"
                className="input"
                value={form.capaciteQuotidienne}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capaciteQuotidienne: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="label">Horaire ouverture</label>
              <input
                type="time"
                className="input"
                value={form.horaireOuverture}
                onChange={(e) =>
                  setForm({ ...form, horaireOuverture: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Horaire fermeture</label>
              <input
                type="time"
                className="input"
                value={form.horaireFermeture}
                onChange={(e) =>
                  setForm({ ...form, horaireFermeture: e.target.value })
                }
              />
            </div>
          </div>

          <MapPicker
            label="Position sur la carte"
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) =>
              setForm({ ...form, latitude: lat, longitude: lng })
            }
          />

          {err && (
            <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn btn-md btn-primary"
          >
            <Save size={14} /> {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Localisation</th>
              <th>Capacité</th>
              <th>Horaires</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id}>
                <td className="font-semibold">{g.nom}</td>
                <td className="text-ink-muted">{g.localisation}</td>
                <td>{g.capaciteQuotidienne}</td>
                <td className="text-xs">
                  {g.horaireOuverture} – {g.horaireFermeture}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-ink-muted">
                  Aucune gare
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TarifsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [gares, setGares] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    periodeDebut: '',
    periodeFin: '',
    coefficientMultiplicateur: 1,
    classeId: '',
    gareDepartId: '',
    gareArriveeId: '',
  });

  async function load() {
    const [list, g, c] = await Promise.all([
      transportApi.listTarifs(),
      transportApi.listGares(),
      transportApi.listClasses(),
    ]);
    setItems(list);
    setGares(g);
    setClasses(c);
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await transportApi.createTarif({
        ...form,
        coefficientMultiplicateur: Number(form.coefficientMultiplicateur),
      });
      setShow(false);
      setForm({
        periodeDebut: '',
        periodeFin: '',
        coefficientMultiplicateur: 1,
        classeId: '',
        gareDepartId: '',
        gareArriveeId: '',
      });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erreur enregistrement');
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce tarif ?')) return;
    await transportApi.deleteTarif(id);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouveau tarif
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Période début</label>
              <input
                type="date"
                className="input"
                value={form.periodeDebut}
                onChange={(e) => setForm({ ...form, periodeDebut: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Période fin</label>
              <input
                type="date"
                className="input"
                value={form.periodeFin}
                onChange={(e) => setForm({ ...form, periodeFin: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Coefficient</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.coefficientMultiplicateur}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coefficientMultiplicateur: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="label">Classe</label>
              <select
                className="input"
                value={form.classeId}
                onChange={(e) => setForm({ ...form, classeId: e.target.value })}
                required
              >
                <option value="">—</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gare départ</label>
              <select
                className="input"
                value={form.gareDepartId}
                onChange={(e) =>
                  setForm({ ...form, gareDepartId: e.target.value })
                }
                required
              >
                <option value="">—</option>
                {gares.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gare arrivée</label>
              <select
                className="input"
                value={form.gareArriveeId}
                onChange={(e) =>
                  setForm({ ...form, gareArriveeId: e.target.value })
                }
                required
              >
                <option value="">—</option>
                {gares.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Créer
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Période</th>
              <th>Classe</th>
              <th>Coefficient</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td className="text-xs">
                  {new Date(t.periodeDebut).toLocaleDateString('fr-FR')} →{' '}
                  {new Date(t.periodeFin).toLocaleDateString('fr-FR')}
                </td>
                <td>{t.classe?.type ?? '—'}</td>
                <td className="font-mono">×{t.coefficientMultiplicateur}</td>
                <td>
                  <button
                    onClick={() => remove(t.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-ink-muted">
                  Aucun tarif
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Modal : Créer / éditer un voyage
// ============================================================
function VoyageFormModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [coops, setCoops] = useState<any[]>([]);
  const [voitures, setVoitures] = useState<any[]>([]);
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Initialisation : edit ou nouveau
  const [form, setForm] = useState<any>(() => {
    if (editing) {
      return {
        id: editing.id,
        dateDepart: editing.dateDepart?.slice(0, 10) ?? '',
        heureDepart: editing.heureDepart ?? '',
        dateArrivee: editing.dateArrivee?.slice(0, 10) ?? '',
        heureArrivee: editing.heureArrivee ?? '',
        villeDepart: editing.villeDepart ?? '',
        villeArrivee: editing.villeArrivee ?? '',
        localisationDepart: editing.localisationDepart ?? '',
        localisationArrivee: editing.localisationArrivee ?? '',
        prix: editing.prix ?? '',
        dureeEstimee: editing.dureeEstimee ?? '',
        statut: editing.statut ?? 'planifie',
        voitureId: editing.voitureId ?? editing.voiture?.id ?? '',
        classeId: editing.classeId ?? editing.classe?.id ?? '',
        chauffeurId: editing.chauffeurId ?? editing.chauffeur?.id ?? '',
        cooperativeId: editing.cooperativeId ?? editing.cooperative?.id ?? '',
        latitudeDepart: editing.latitudeDepart ?? null,
        longitudeDepart: editing.longitudeDepart ?? null,
        latitudeArrivee: editing.latitudeArrivee ?? null,
        longitudeArrivee: editing.longitudeArrivee ?? null,
      };
    }
    return {
      dateDepart: '',
      heureDepart: '',
      dateArrivee: '',
      heureArrivee: '',
      villeDepart: '',
      villeArrivee: '',
      localisationDepart: '',
      localisationArrivee: '',
      prix: '',
      dureeEstimee: '',
      statut: 'planifie',
      voitureId: '',
      classeId: '',
      chauffeurId: '',
      cooperativeId: '',
      latitudeDepart: null as number | null,
      longitudeDepart: null as number | null,
      latitudeArrivee: null as number | null,
      longitudeArrivee: null as number | null,
    };
  });

  // Charge les listes de référence
  useEffect(() => {
    (async () => {
      const [c, v, ch, cl] = await Promise.all([
        transportApi.listCoops({ limit: 500 }),
        transportApi.listVoitures({ limit: 500 }),
        transportApi.listChauffeurs({ limit: 500 }),
        transportApi.listClasses(),
      ]);
      setCoops(c.items);
      setVoitures(v.items);
      setChauffeurs(ch.items);
      setClasses(cl);
    })();
  }, []);

  // Filtre les voitures et chauffeurs par coopérative
  const voituresFiltered = form.cooperativeId
    ? voitures.filter((v) => v.cooperativeId === form.cooperativeId)
    : voitures;
  const chauffeursFiltered = form.voitureId
    ? chauffeurs.filter((c) => c.voitureId === form.voitureId)
    : chauffeurs;

  // Haversine distance en km
  function haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  const distanceKm =
    form.latitudeDepart != null &&
    form.longitudeDepart != null &&
    form.latitudeArrivee != null &&
    form.longitudeArrivee != null
      ? haversineKm(
          form.latitudeDepart,
          form.longitudeDepart,
          form.latitudeArrivee,
          form.longitudeArrivee,
        )
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await transportApi.upsertVoyage({
        ...form,
        prix: Number(form.prix),
        dureeEstimee: form.dureeEstimee || undefined,
        distanceKm,
      });
      onSaved();
    } catch (e: any) {
      setErr(
        e?.response?.data?.message || e?.message || "Erreur d'enregistrement",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-auto"
      onClick={onClose}
    >
      <div
        className="card p-6 max-w-5xl w-full my-8 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">
            {editing ? 'Éditer le voyage' : 'Nouveau voyage'}
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Coopérative */}
          <div>
            <label className="label">Coopérative</label>
            <select
              className="input"
              value={form.cooperativeId}
              onChange={(e) =>
                setForm({
                  ...form,
                  cooperativeId: e.target.value,
                  voitureId: '',
                  chauffeurId: '',
                })
              }
              required
            >
              <option value="">— Sélectionner —</option>
              {coops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Voiture + Chauffeur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">
                Voiture {form.cooperativeId && `(${voituresFiltered.length} dispo)`}
              </label>
              <select
                className="input"
                value={form.voitureId}
                onChange={(e) =>
                  setForm({ ...form, voitureId: e.target.value, chauffeurId: '' })
                }
                required
                disabled={!form.cooperativeId}
              >
                <option value="">— Sélectionner —</option>
                {voituresFiltered.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.matricule} ({v.marque} {v.modele}, {v.capacite} pl.)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Chauffeur</label>
              <select
                className="input"
                value={form.chauffeurId}
                onChange={(e) =>
                  setForm({ ...form, chauffeurId: e.target.value })
                }
                required
                disabled={!form.voitureId}
              >
                <option value="">— Sélectionner —</option>
                {chauffeursFiltered.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom} · {c.numeroPermis}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Classe */}
          <div>
            <label className="label">Classe de service</label>
            <select
              className="input"
              value={form.classeId}
              onChange={(e) => setForm({ ...form, classeId: e.target.value })}
              required
            >
              <option value="">— Sélectionner —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type} (×{c.coefficientPrix})
                </option>
              ))}
            </select>
          </div>

          {/* Itinéraire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Ville départ</label>
              <input
                className="input"
                value={form.villeDepart}
                onChange={(e) =>
                  setForm({ ...form, villeDepart: e.target.value })
                }
                placeholder="Antananarivo"
                required
              />
            </div>
            <div>
              <label className="label">Ville arrivée</label>
              <input
                className="input"
                value={form.villeArrivee}
                onChange={(e) =>
                  setForm({ ...form, villeArrivee: e.target.value })
                }
                placeholder="Tamatave"
                required
              />
            </div>
            <div>
              <label className="label">Localisation départ (gare/adresse)</label>
              <input
                className="input"
                value={form.localisationDepart}
                onChange={(e) =>
                  setForm({ ...form, localisationDepart: e.target.value })
                }
                placeholder="Gare routière d'Anosibe"
                required
              />
            </div>
            <div>
              <label className="label">Localisation arrivée</label>
              <input
                className="input"
                value={form.localisationArrivee}
                onChange={(e) =>
                  setForm({ ...form, localisationArrivee: e.target.value })
                }
                placeholder="Gare routière Tamatave"
                required
              />
            </div>
          </div>

          {/* Cartes départ + arrivée */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MapPicker
              label="📍 Point de départ"
              height={240}
              latitude={form.latitudeDepart}
              longitude={form.longitudeDepart}
              onChange={(lat, lng) =>
                setForm({ ...form, latitudeDepart: lat, longitudeDepart: lng })
              }
            />
            <MapPicker
              label="🏁 Point d'arrivée"
              height={240}
              latitude={form.latitudeArrivee}
              longitude={form.longitudeArrivee}
              onChange={(lat, lng) =>
                setForm({
                  ...form,
                  latitudeArrivee: lat,
                  longitudeArrivee: lng,
                })
              }
            />
          </div>
          {distanceKm != null && (
            <div className="text-xs text-ink-muted bg-bg-elevated/50 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <Route size={12} className="text-brand-300" />
              Distance à vol d'oiseau :{' '}
              <span className="font-bold text-ink">
                {distanceKm.toFixed(1)} km
              </span>
            </div>
          )}

          {/* Horaires */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Date départ</label>
              <input
                type="date"
                className="input"
                value={form.dateDepart}
                onChange={(e) =>
                  setForm({ ...form, dateDepart: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Heure départ</label>
              <input
                type="time"
                className="input"
                value={form.heureDepart}
                onChange={(e) =>
                  setForm({ ...form, heureDepart: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Date arrivée</label>
              <input
                type="date"
                className="input"
                value={form.dateArrivee}
                onChange={(e) =>
                  setForm({ ...form, dateArrivee: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Heure arrivée</label>
              <input
                type="time"
                className="input"
                value={form.heureArrivee}
                onChange={(e) =>
                  setForm({ ...form, heureArrivee: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Prix + durée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Prix de base (Ar)</label>
              <input
                type="number"
                step="100"
                min="0"
                className="input"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                placeholder="50000"
                required
              />
            </div>
            <div>
              <label className="label">Durée estimée (optionnel)</label>
              <input
                className="input"
                value={form.dureeEstimee}
                onChange={(e) =>
                  setForm({ ...form, dureeEstimee: e.target.value })
                }
                placeholder="8h"
              />
            </div>
          </div>

          {/* Statut (édition uniquement) */}
          {editing && (
            <div>
              <label className="label">Statut</label>
              <select
                className="input"
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
              >
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          )}

          {err && (
            <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-bg-border">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-md btn-ghost"
              disabled={busy}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-md btn-primary"
            >
              <Save size={14} />{' '}
              {busy
                ? 'Enregistrement…'
                : editing
                  ? 'Mettre à jour'
                  : 'Créer le voyage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  tone = 'brand',
}: {
  label: string;
  value: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const cls = {
    brand: 'text-brand-300',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-400',
  }[tone];
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-dim">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}

// ============================================================
// Voitures
// ============================================================
function VoituresTab() {
  const [items, setItems] = useState<any[]>([]);
  const [coops, setCoops] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [etat, setEtat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    matricule: '',
    nom: '',
    capacite: '',
    anneeFabrication: '',
    marque: '',
    modele: '',
    etat: 'disponible',
    dateDernierEntretien: '',
    cooperativeId: '',
  });

  async function load() {
    const [list, c] = await Promise.all([
      transportApi.listVoitures({
        q: q || undefined,
        etat: etat || undefined,
        limit: 100,
      }),
      transportApi.listCoops({ limit: 200 }),
    ]);
    setItems(list.items);
    setCoops(c.items);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, etat]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await transportApi.upsertVoiture(form);
    setShowForm(false);
    setForm({
      matricule: '',
      nom: '',
      capacite: '',
      anneeFabrication: '',
      marque: '',
      modele: '',
      etat: 'disponible',
      dateDernierEntretien: '',
      cooperativeId: '',
    });
    load();
  }

  async function edit(v: any) {
    setForm({
      id: v.id,
      matricule: v.matricule,
      nom: v.nom ?? '',
      capacite: v.capacite,
      anneeFabrication: v.anneeFabrication ?? '',
      marque: v.marque ?? '',
      modele: v.modele ?? '',
      etat: v.etat,
      dateDernierEntretien: v.dateDernierEntretien
        ? new Date(v.dateDernierEntretien).toISOString().slice(0, 10)
        : '',
      cooperativeId: v.cooperativeId,
    });
    setShowForm(true);
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette voiture ?')) return;
    try {
      await transportApi.deleteVoiture(id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }

  async function changeEtat(id: string, e: string) {
    await transportApi.setVoitureEtat(id, e);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Matricule, marque, modèle…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-auto"
          value={etat}
          onChange={(e) => setEtat(e.target.value)}
        >
          <option value="">Tous états</option>
          <option value="disponible">Disponible</option>
          <option value="en_reparation">En réparation</option>
          <option value="hors_service">Hors service</option>
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle voiture
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Matricule</label>
              <input
                className="input font-mono"
                value={form.matricule}
                onChange={(e) =>
                  setForm({ ...form, matricule: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Coopérative</label>
              <select
                className="input"
                value={form.cooperativeId}
                onChange={(e) =>
                  setForm({ ...form, cooperativeId: e.target.value })
                }
                required
              >
                <option value="">—</option>
                {coops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Capacité (places)</label>
              <input
                type="number"
                className="input"
                value={form.capacite}
                onChange={(e) => setForm({ ...form, capacite: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Nom (alias)</label>
              <input
                className="input"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Marque</label>
              <input
                className="input"
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Modèle</label>
              <input
                className="input"
                value={form.modele}
                onChange={(e) => setForm({ ...form, modele: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Année fabrication</label>
              <input
                type="number"
                className="input"
                value={form.anneeFabrication}
                onChange={(e) =>
                  setForm({ ...form, anneeFabrication: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">État</label>
              <select
                className="input"
                value={form.etat}
                onChange={(e) => setForm({ ...form, etat: e.target.value })}
              >
                <option value="disponible">Disponible</option>
                <option value="en_reparation">En réparation</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
            <div>
              <label className="label">Dernier entretien</label>
              <input
                type="date"
                className="input"
                value={form.dateDernierEntretien}
                onChange={(e) =>
                  setForm({ ...form, dateDernierEntretien: e.target.value })
                }
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Marque / modèle</th>
              <th>Capacité</th>
              <th>Coopérative</th>
              <th>État</th>
              <th>Dernier entretien</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td className="font-mono font-bold">{v.matricule}</td>
                <td>
                  <div>{v.marque ?? '—'} {v.modele ?? ''}</div>
                  {v.nom && (
                    <div className="text-xs text-ink-muted">{v.nom}</div>
                  )}
                </td>
                <td>{v.capacite} pl.</td>
                <td className="text-ink-muted">{v.cooperative?.nom}</td>
                <td>
                  <select
                    className="input py-1 text-xs"
                    value={v.etat}
                    onChange={(e) => changeEtat(v.id, e.target.value)}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="en_reparation">En réparation</option>
                    <option value="hors_service">Hors service</option>
                  </select>
                </td>
                <td className="text-ink-muted text-xs">
                  {v.dateDernierEntretien
                    ? new Date(v.dateDernierEntretien).toLocaleDateString('fr-FR')
                    : '—'}
                </td>
                <td className="space-x-1">
                  <Link
                    to={`/transport/voitures/${v.id}/layout`}
                    className="btn btn-sm btn-secondary"
                    title="Plan des places"
                  >
                    🪑
                  </Link>
                  <button
                    onClick={() => edit(v)}
                    className="btn btn-sm btn-ghost"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => remove(v.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-ink-muted">
                  Aucune voiture
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Maintenance alerts
// ============================================================
function MaintenanceTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    transportApi.maintenanceAlerts().then(setItems);
  }, []);

  return (
    <div>
      <div className="card p-4 mb-4 bg-warning-bg/30 border-warning-500/30">
        <div className="text-sm text-warning-500 font-bold mb-1">
          Voitures sans entretien depuis ≥ 6 mois (ou jamais)
        </div>
        <div className="text-xs text-ink-muted">
          {items.length} véhicule(s) à inspecter
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Voiture</th>
              <th>Coopérative</th>
              <th>État</th>
              <th>Dernier entretien</th>
              <th>Jours</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td className="font-mono font-bold">{v.matricule}</td>
                <td>{v.marque} {v.modele}</td>
                <td className="text-ink-muted">{v.cooperative}</td>
                <td>
                  <span
                    className={
                      v.etat === 'disponible'
                        ? 'badge-success'
                        : 'badge-warning'
                    }
                  >
                    {v.etat}
                  </span>
                </td>
                <td className="text-ink-muted text-xs">
                  {v.dateDernierEntretien
                    ? new Date(v.dateDernierEntretien).toLocaleDateString('fr-FR')
                    : 'Jamais'}
                </td>
                <td>
                  <span
                    className={
                      v.joursDepuisEntretien === null ||
                      v.joursDepuisEntretien > 365
                        ? 'badge-danger'
                        : 'badge-warning'
                    }
                  >
                    {v.joursDepuisEntretien ?? '∞'} j
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-success-500">
                  ✅ Tous les véhicules sont à jour
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Classes (CRUD complet)
// ============================================================
function ClassesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    type: '',
    description: '',
    coefficientPrix: 1.0,
  });

  async function load() {
    setItems(await transportApi.listClasses());
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await transportApi.upsertClasse({
        ...form,
        coefficientPrix: Number(form.coefficientPrix),
      });
      setShow(false);
      setForm({ type: '', description: '', coefficientPrix: 1.0 });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erreur enregistrement');
    }
  }
  async function edit(c: any) {
    setForm({
      id: c.id,
      type: c.type,
      description: c.description ?? '',
      coefficientPrix: c.coefficientPrix,
    });
    setShow(true);
  }
  async function remove(id: string) {
    if (!confirm('Supprimer cette classe ?')) return;
    try {
      await transportApi.deleteClasse(id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle classe
        </button>
      </div>
      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <input
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="économique / confort / luxe / vip"
                required
              />
            </div>
            <div>
              <label className="label">Coefficient prix</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.coefficientPrix}
                onChange={(e) =>
                  setForm({ ...form, coefficientPrix: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}
      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Type</th>
              <th>Coefficient</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-bold">{c.type}</td>
                <td className="font-mono">×{c.coefficientPrix}</td>
                <td className="text-ink-muted">{c.description ?? '—'}</td>
                <td className="space-x-1">
                  <button
                    onClick={() => edit(c)}
                    className="btn btn-sm btn-ghost"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-ink-muted">
                  Aucune classe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Voyages
// ============================================================
function VoyagesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function load() {
    const list = await transportApi.listVoyages({
      statut: statut || undefined,
      q: q || undefined,
      limit: 100,
    });
    setItems(list.items);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut, q]);

  async function cancel(id: string) {
    const reason = prompt('Motif d\'annulation (min. 5 caractères) :');
    if (!reason || reason.trim().length < 5) return;
    try {
      const res = await transportApi.cancelVoyage(id, reason);
      alert(`Voyage annulé. ${res.refundsTriggered} remboursements déclenchés.`);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }
  async function changeStatut(id: string, s: string) {
    await transportApi.setVoyageStatut(id, s);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <input
            className="input pl-9"
            placeholder="Ville départ / arrivée…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="planifie">Planifié</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="annule">Annulé</option>
        </select>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouveau voyage
        </button>
      </div>

      {showForm && (
        <VoyageFormModal
          editing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Date départ</th>
              <th>Trajet</th>
              <th>Voiture / Chauffeur</th>
              <th>Coopérative</th>
              <th>Prix</th>
              <th>Statut</th>
              <th>Réserv.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td className="text-xs">
                  {new Date(v.dateDepart).toLocaleDateString('fr-FR')}
                  <div className="text-ink-muted">{v.heureDepart}</div>
                </td>
                <td>
                  <div className="font-semibold">
                    {v.villeDepart} → {v.villeArrivee}
                  </div>
                  {v.distanceKm && (
                    <div className="text-xs text-ink-muted">
                      {v.distanceKm} km
                    </div>
                  )}
                </td>
                <td className="text-xs">
                  <div className="font-mono">{v.voiture?.matricule}</div>
                  <div className="text-ink-muted">
                    {v.chauffeur?.prenom} {v.chauffeur?.nom}
                  </div>
                </td>
                <td className="text-ink-muted text-xs">
                  {v.cooperative?.nom}
                </td>
                <td className="font-bold">
                  {Number(v.prix).toLocaleString('fr-FR')}
                </td>
                <td>
                  <select
                    className="input py-1 text-xs"
                    value={v.statut}
                    disabled={v.statut === 'annule'}
                    onChange={(e) => changeStatut(v.id, e.target.value)}
                  >
                    <option value="planifie">Planifié</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    {v.statut === 'annule' && (
                      <option value="annule">Annulé</option>
                    )}
                  </select>
                </td>
                <td className="text-center">
                  <span className="badge-info">
                    {v._count?.reservations ?? 0}
                  </span>
                </td>
                <td className="space-x-1">
                  <Link
                    to={`/transport/voyages/${v.id}`}
                    className="btn btn-sm btn-secondary"
                  >
                    <Eye size={12} />
                  </Link>
                  {v.statut !== 'annule' && v.statut !== 'termine' && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(v);
                          setShowForm(true);
                        }}
                        className="btn btn-sm btn-ghost"
                        title="Éditer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => cancel(v.id)}
                        className="btn btn-sm btn-danger"
                        title="Annuler le voyage"
                      >
                        <XOctagon size={12} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-ink-muted">
                  Aucun voyage
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Réservations
// ============================================================
function ReservationsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [statusReservation, setStatusReservation] = useState('');
  const [statusPaiement, setStatusPaiement] = useState('');

  async function load() {
    const list = await transportApi.listReservations({
      statusReservation: statusReservation || undefined,
      statusPaiement: statusPaiement || undefined,
      limit: 100,
    });
    setItems(list.items);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusReservation, statusPaiement]);

  async function refund(id: string) {
    const reason = prompt('Motif du remboursement :');
    if (!reason || reason.trim().length < 3) return;
    try {
      await transportApi.refundReservation(id, reason);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }
  async function noShow(id: string) {
    if (!confirm('Marquer comme no-show ?')) return;
    await transportApi.markNoShow(id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          className="input w-auto"
          value={statusReservation}
          onChange={(e) => setStatusReservation(e.target.value)}
        >
          <option value="">Tous statuts réservation</option>
          <option value="confirmée">Confirmée</option>
          <option value="en_attente">En attente</option>
          <option value="annulee">Annulée</option>
          <option value="terminee">Terminée</option>
        </select>
        <select
          className="input w-auto"
          value={statusPaiement}
          onChange={(e) => setStatusPaiement(e.target.value)}
        >
          <option value="">Tous statuts paiement</option>
          <option value="en_attente">En attente</option>
          <option value="paye">Payé</option>
          <option value="annule">Annulé</option>
          <option value="rembourse">Remboursé</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Passager</th>
              <th>Voyage</th>
              <th>Place</th>
              <th>Prix</th>
              <th>Réserv.</th>
              <th>Paiement</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.codeConfirmation}</td>
                <td>
                  <div className="font-semibold">
                    {r.user?.prenom} {r.user?.nom}
                  </div>
                  <div className="text-xs text-ink-muted">{r.user?.email}</div>
                </td>
                <td className="text-xs">
                  <div>{r.voyage?.villeDepart} → {r.voyage?.villeArrivee}</div>
                  <div className="text-ink-muted">
                    {new Date(r.voyage?.dateDepart).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="text-center font-bold">{r.numPlace}</td>
                <td>{Number(r.prixPaye).toLocaleString('fr-FR')}</td>
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
                          : r.statusPaiement === 'annule'
                            ? 'badge-danger'
                            : 'badge-warning'
                    }
                  >
                    {r.statusPaiement}
                  </span>
                </td>
                <td className="space-x-1">
                  {r.statusPaiement === 'paye' && (
                    <button
                      onClick={() => refund(r.id)}
                      className="btn btn-sm btn-secondary"
                      title="Rembourser"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                  {r.statusReservation === 'confirmée' && (
                    <button
                      onClick={() => noShow(r.id)}
                      className="btn btn-sm btn-ghost"
                      title="No-show"
                    >
                      🚫
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-ink-muted">
                  Aucune réservation
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Paiements
// ============================================================
function PaiementsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [volume, setVolume] = useState(0);
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('');

  async function load() {
    const list = await transportApi.listPaiements({
      statut: statut || undefined,
      mode: mode || undefined,
      limit: 100,
    });
    setItems(list.items);
    setVolume(list.volume);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut, mode]);

  async function refund(id: string) {
    if (!confirm('Rembourser ce paiement ?')) return;
    await transportApi.refundPaiement(id);
    load();
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Mini label="Volume (filtré)" value={Number(volume)} tone="success" />
        <Mini label="Paiements affichés" value={items.length} tone="brand" />
        <Mini
          label="Remboursés"
          value={items.filter((p) => p.statut === 'rembourse').length}
          tone="warning"
        />
      </div>
      <div className="flex gap-2 mb-4">
        <select
          className="input w-auto"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="effectue">Effectué</option>
          <option value="echoue">Échoué</option>
          <option value="rembourse">Remboursé</option>
        </select>
        <select
          className="input w-auto"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="">Tous modes</option>
          <option value="carte">Carte</option>
          <option value="mobile">Mobile</option>
          <option value="especes">Espèces</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Date</th>
              <th>Référence</th>
              <th>Passager</th>
              <th>Voyage</th>
              <th>Mode</th>
              <th>Montant</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td className="text-xs text-ink-muted">
                  {new Date(p.datePaiement).toLocaleString('fr-FR')}
                </td>
                <td className="font-mono text-xs">
                  {p.referenceTransaction ?? '—'}
                </td>
                <td>
                  {p.reservation?.user?.prenom} {p.reservation?.user?.nom}
                </td>
                <td className="text-xs">
                  {p.reservation?.voyage?.villeDepart} →{' '}
                  {p.reservation?.voyage?.villeArrivee}
                </td>
                <td>
                  <span className="badge-info">{p.modePaiement}</span>
                </td>
                <td className="font-bold">
                  {Number(p.montant).toLocaleString('fr-FR')}
                </td>
                <td>
                  <span
                    className={
                      p.statut === 'effectue'
                        ? 'badge-success'
                        : p.statut === 'rembourse'
                          ? 'badge-info'
                          : 'badge-danger'
                    }
                  >
                    {p.statut}
                  </span>
                </td>
                <td>
                  {p.statut === 'effectue' && (
                    <button
                      onClick={() => refund(p.id)}
                      className="btn btn-sm btn-secondary"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-ink-muted">
                  Aucun paiement
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Annonces
// ============================================================
function AnnoncesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [coops, setCoops] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    titre: '',
    description: '',
    dateExpiration: '',
    typeAnnonce: 'information',
    cooperativeId: '',
  });

  async function load() {
    const [list, c] = await Promise.all([
      transportApi.listAnnonces({ limit: 100 }),
      transportApi.listCoops({ limit: 200 }),
    ]);
    setItems(list.items);
    setCoops(c.items);
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await transportApi.upsertAnnonce(form);
      setShow(false);
      setForm({
        titre: '',
        description: '',
        dateExpiration: '',
        typeAnnonce: 'information',
        cooperativeId: '',
      });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Erreur enregistrement');
    }
  }
  async function edit(a: any) {
    setForm({
      id: a.id,
      titre: a.titre,
      description: a.description,
      dateExpiration: new Date(a.dateExpiration).toISOString().slice(0, 10),
      typeAnnonce: a.typeAnnonce,
      cooperativeId: a.cooperativeId,
    });
    setShow(true);
  }
  async function remove(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return;
    await transportApi.deleteAnnonce(id);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle annonce
        </button>
      </div>
      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Titre</label>
              <input
                className="input"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.typeAnnonce}
                onChange={(e) =>
                  setForm({ ...form, typeAnnonce: e.target.value })
                }
              >
                <option value="information">Information</option>
                <option value="promotion">Promotion</option>
                <option value="alerte">Alerte</option>
              </select>
            </div>
            <div>
              <label className="label">Coopérative</label>
              <select
                className="input"
                value={form.cooperativeId}
                onChange={(e) =>
                  setForm({ ...form, cooperativeId: e.target.value })
                }
                required
              >
                <option value="">—</option>
                {coops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date d'expiration</label>
              <input
                type="date"
                className="input"
                value={form.dateExpiration}
                onChange={(e) =>
                  setForm({ ...form, dateExpiration: e.target.value })
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px]"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Type</th>
              <th>Coopérative</th>
              <th>Publié</th>
              <th>Expire</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="font-semibold">{a.titre}</div>
                  <div className="text-xs text-ink-muted max-w-md truncate">
                    {a.description}
                  </div>
                </td>
                <td>
                  <span
                    className={
                      a.typeAnnonce === 'alerte'
                        ? 'badge-danger'
                        : a.typeAnnonce === 'promotion'
                          ? 'badge-success'
                          : 'badge-info'
                    }
                  >
                    {a.typeAnnonce}
                  </span>
                </td>
                <td className="text-ink-muted">{a.cooperative?.nom}</td>
                <td className="text-xs">
                  {new Date(a.datePublication).toLocaleDateString('fr-FR')}
                </td>
                <td className="text-xs">
                  {new Date(a.dateExpiration).toLocaleDateString('fr-FR')}
                </td>
                <td className="space-x-1">
                  <button
                    onClick={() => edit(a)}
                    className="btn btn-sm btn-ghost"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="btn btn-sm btn-ghost text-danger-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucune annonce
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Historique trajets
// ============================================================
function HistoriqueTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    transportApi.listHistorique({ limit: 100 }).then((l) => setItems(l.items));
  }, []);

  return (
    <div className="card overflow-hidden">
      <table className="table-base">
        <thead>
          <tr>
            <th>Date affectation</th>
            <th>Chauffeur</th>
            <th>Voyage</th>
            <th>Statut voyage</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id}>
              <td className="text-xs text-ink-muted">
                {new Date(h.dateAffectation).toLocaleString('fr-FR')}
              </td>
              <td className="font-semibold">
                {h.chauffeur?.prenom} {h.chauffeur?.nom}
              </td>
              <td className="text-xs">
                {h.voyage?.villeDepart} → {h.voyage?.villeArrivee} ·{' '}
                {new Date(h.voyage?.dateDepart).toLocaleDateString('fr-FR')}
              </td>
              <td>
                <span
                  className={
                    h.voyage?.statut === 'termine'
                      ? 'badge-success'
                      : h.voyage?.statut === 'annule'
                        ? 'badge-danger'
                        : 'badge-warning'
                  }
                >
                  {h.voyage?.statut}
                </span>
              </td>
              <td className="text-ink-muted text-xs max-w-md truncate">
                {h.notesPerformance ?? '—'}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-ink-muted">
                Aucun historique
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
