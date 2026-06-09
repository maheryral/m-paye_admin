// src/pages/VehicleRentals.tsx
//
// CRUD Location de voiture (Phase 1) — 3 onglets : Partenaires / Véhicules / Annonces.
// Pas de portail partenaire externe pour l'instant : l'équipe ops gère ici.

import { useEffect, useMemo, useState } from 'react';
import { Car, Plus, Trash2, Save, Building2, Tag } from 'lucide-react';
import {
  vehicleRentalsAdminApi,
  type RentalPartnerRow,
  type RentalVehicleRow,
  type RentalListingRow,
} from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

type Tab = 'partners' | 'vehicles' | 'listings';

export default function VehicleRentals() {
  const [tab, setTab] = useState<Tab>('partners');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Car}
        title="Location de voiture"
        subtitle="Gestion des partenaires, véhicules et annonces"
      />

      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {(
          [
            { id: 'partners', label: 'Partenaires', icon: Building2 },
            { id: 'vehicles', label: 'Véhicules', icon: Car },
            { id: 'listings', label: 'Annonces', icon: Tag },
          ] as { id: Tab; label: string; icon: any }[]
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                active
                  ? 'bg-gradient-brand text-white shadow-glow-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-bg-elevated/70'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'partners' && <PartnersTab />}
      {tab === 'vehicles' && <VehiclesTab />}
      {tab === 'listings' && <ListingsTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PARTENAIRES
// ─────────────────────────────────────────────────────────────────────────

function PartnersTab() {
  const [items, setItems] = useState<RentalPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<RentalPartnerRow>>({});
  const [editing, setEditing] = useState<RentalPartnerRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await vehicleRentalsAdminApi.listPartners());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city) return;
    setBusy(true);
    try {
      if (editing) {
        await vehicleRentalsAdminApi.updatePartner(editing.id, form);
      } else {
        await vehicleRentalsAdminApi.createPartner(form);
      }
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (p: RentalPartnerRow) => {
    setEditing(p);
    setForm({ ...p });
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce partenaire ? Cascade sur véhicules + annonces.')) return;
    await vehicleRentalsAdminApi.deletePartner(id);
    await load();
  };

  return (
    <div className="space-y-5">
      {/* Formulaire création/édition */}
      <form onSubmit={save} className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="input md:col-span-2"
          placeholder="Nom du partenaire"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Ville"
          value={form.city || ''}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Téléphone"
          value={form.phone || ''}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Email (optionnel)"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder="URL logo (optionnel)"
          value={form.logoUrl || ''}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
        />
        {/* Coordonnées GPS (optionnelles) — utilisées pour le pin sur la carte
            de la page détail. Trouve-les facilement sur Google Maps : clic droit
            sur le lieu → copie "lat, lng". */}
        <input
          className="input"
          type="number"
          step="0.0000001"
          placeholder="Latitude (ex: -18.9101)"
          value={form.latitude ?? ''}
          onChange={(e) =>
            setForm({ ...form, latitude: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
        <input
          className="input"
          type="number"
          step="0.0000001"
          placeholder="Longitude (ex: 47.5255)"
          value={form.longitude ?? ''}
          onChange={(e) =>
            setForm({ ...form, longitude: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
        <textarea
          className="input md:col-span-3 min-h-[60px]"
          placeholder="Description (optionnel)"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Actif
        </label>
        <div className="md:col-span-3 flex gap-2 justify-end">
          {editing && (
            <button type="button" className="btn btn-md btn-ghost" onClick={resetForm}>
              Annuler
            </button>
          )}
          <button type="submit" className="btn btn-md btn-primary" disabled={busy}>
            {editing ? <Save size={14} /> : <Plus size={14} />}
            {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville</th>
                <th>Téléphone</th>
                <th>Véhicules</th>
                <th>Annonces</th>
                <th>Actif</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-ink-muted">
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-ink-muted">
                    Aucun partenaire
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td>{p.city}</td>
                  <td className="text-xs">{p.phone}</td>
                  <td className="text-center">{p._count?.vehicles ?? 0}</td>
                  <td className="text-center">{p._count?.listings ?? 0}</td>
                  <td>
                    <span
                      className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}
                    >
                      {p.isActive ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="flex gap-1 justify-end">
                    <button onClick={() => startEdit(p)} className="btn btn-sm btn-ghost">
                      Modifier
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="btn btn-sm btn-ghost text-danger-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VÉHICULES
// ─────────────────────────────────────────────────────────────────────────

function VehiclesTab() {
  const [items, setItems] = useState<RentalVehicleRow[]>([]);
  const [partners, setPartners] = useState<RentalPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<RentalVehicleRow>>({});
  const [editing, setEditing] = useState<RentalVehicleRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [vs, ps] = await Promise.all([
        vehicleRentalsAdminApi.listVehicles(),
        vehicleRentalsAdminApi.listPartners(),
      ]);
      setItems(vs);
      setPartners(ps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partnerId || !form.brand || !form.model || !form.type || !form.seats) return;
    setBusy(true);
    try {
      if (editing) {
        await vehicleRentalsAdminApi.updateVehicle(editing.id, form);
      } else {
        await vehicleRentalsAdminApi.createVehicle(form);
      }
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (v: RentalVehicleRow) => {
    setEditing(v);
    setForm({ ...v });
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce véhicule ? Cascade sur annonces.')) return;
    await vehicleRentalsAdminApi.deleteVehicle(id);
    await load();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="input"
          value={form.partnerId || ''}
          onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
          required
        >
          <option value="">— Partenaire —</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Marque (Toyota)"
          value={form.brand || ''}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Modèle (Hilux)"
          value={form.model || ''}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="Année"
          value={form.year || ''}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) || undefined })}
        />
        <select
          className="input"
          value={form.type || ''}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        >
          <option value="">— Type —</option>
          <option value="4x4">4×4</option>
          <option value="sedan">Berline</option>
          <option value="suv">SUV</option>
          <option value="minibus">Minibus</option>
          <option value="luxury">Luxe</option>
          <option value="city">Citadine</option>
        </select>
        <input
          className="input"
          type="number"
          placeholder="Places"
          value={form.seats || ''}
          onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
          required
        />
        <select
          className="input"
          value={form.transmission || 'manual'}
          onChange={(e) => setForm({ ...form, transmission: e.target.value })}
        >
          <option value="manual">Manuelle</option>
          <option value="automatic">Automatique</option>
        </select>
        <select
          className="input"
          value={form.fuel || 'essence'}
          onChange={(e) => setForm({ ...form, fuel: e.target.value })}
        >
          <option value="essence">Essence</option>
          <option value="diesel">Diesel</option>
          <option value="hybrid">Hybride</option>
          <option value="electric">Électrique</option>
        </select>
        <textarea
          className="input md:col-span-4 min-h-[60px]"
          placeholder="Description (optionnel)"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hasAC ?? true}
            onChange={(e) => setForm({ ...form, hasAC: e.target.checked })}
          />
          Climatisation
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Actif
        </label>
        <div className="md:col-span-4 flex gap-2 justify-end">
          {editing && (
            <button type="button" className="btn btn-md btn-ghost" onClick={resetForm}>
              Annuler
            </button>
          )}
          <button type="submit" className="btn btn-md btn-primary" disabled={busy}>
            {editing ? <Save size={14} /> : <Plus size={14} />}
            {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th>Partenaire</th>
                <th>Type</th>
                <th>Places</th>
                <th>Boîte</th>
                <th>Annonces</th>
                <th>Actif</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-ink-muted">
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-ink-muted">
                    Aucun véhicule
                  </td>
                </tr>
              )}
              {items.map((v) => (
                <tr key={v.id}>
                  <td className="font-semibold">
                    {v.brand} {v.model}
                    {v.year && <span className="text-ink-muted text-xs ml-1">({v.year})</span>}
                  </td>
                  <td className="text-xs">{v.partner?.name}</td>
                  <td className="uppercase text-xs">{v.type}</td>
                  <td className="text-center">{v.seats}</td>
                  <td className="text-xs">{v.transmission === 'automatic' ? 'Auto' : 'Man.'}</td>
                  <td className="text-center">{v._count?.listings ?? 0}</td>
                  <td>
                    <span className={`badge ${v.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {v.isActive ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="flex gap-1 justify-end">
                    <button onClick={() => startEdit(v)} className="btn btn-sm btn-ghost">
                      Modifier
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ANNONCES (LISTINGS)
// ─────────────────────────────────────────────────────────────────────────

function ListingsTab() {
  const [items, setItems] = useState<RentalListingRow[]>([]);
  const [vehicles, setVehicles] = useState<RentalVehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<RentalListingRow>>({});
  const [editing, setEditing] = useState<RentalListingRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ls, vs] = await Promise.all([
        vehicleRentalsAdminApi.listListings(),
        vehicleRentalsAdminApi.listVehicles(),
      ]);
      setItems(ls);
      setVehicles(vs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const vehicleLabel = useMemo(
    () => (id: string) => {
      const v = vehicles.find((x) => x.id === id);
      return v ? `${v.brand} ${v.model}` : id;
    },
    [vehicles],
  );

  const resetForm = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.city || !form.pricePerDay) return;
    setBusy(true);
    try {
      const payload: any = {
        vehicleId: form.vehicleId,
        city: form.city,
        pricePerDay: Number(form.pricePerDay),
        withDriver: !!form.withDriver,
        deposit: Number(form.deposit || 0),
        minDays: Number(form.minDays || 1),
        notes: form.notes,
        isActive: form.isActive ?? true,
      };
      if (editing) {
        await vehicleRentalsAdminApi.updateListing(editing.id, payload);
      } else {
        await vehicleRentalsAdminApi.createListing(payload);
      }
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (l: RentalListingRow) => {
    setEditing(l);
    setForm({ ...l });
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    await vehicleRentalsAdminApi.deleteListing(id);
    await load();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="input md:col-span-2"
          value={form.vehicleId || ''}
          onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
          required
          disabled={!!editing}
        >
          <option value="">— Véhicule —</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model} ({v.partner?.name})
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Ville prise en charge"
          value={form.city || ''}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="Prix / jour (Ar)"
          value={form.pricePerDay || ''}
          onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="Caution (Ar, 0 si N/A)"
          value={form.deposit || ''}
          onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
        />
        <input
          className="input"
          type="number"
          placeholder="Jours minimum"
          value={form.minDays || ''}
          onChange={(e) => setForm({ ...form, minDays: Number(e.target.value) })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.withDriver}
            onChange={(e) => setForm({ ...form, withDriver: e.target.checked })}
          />
          Avec chauffeur
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Actif
        </label>
        <textarea
          className="input md:col-span-4 min-h-[60px]"
          placeholder="Notes (ex: chauffeur bilingue, caution obligatoire…)"
          value={form.notes || ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="md:col-span-4 flex gap-2 justify-end">
          {editing && (
            <button type="button" className="btn btn-md btn-ghost" onClick={resetForm}>
              Annuler
            </button>
          )}
          <button type="submit" className="btn btn-md btn-primary" disabled={busy}>
            {editing ? <Save size={14} /> : <Plus size={14} />}
            {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th>Partenaire</th>
                <th>Ville</th>
                <th>Prix/j</th>
                <th>Mode</th>
                <th>Min</th>
                <th>Caution</th>
                <th>Actif</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-ink-muted">
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-ink-muted">
                    Aucune annonce
                  </td>
                </tr>
              )}
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="font-semibold">
                    {l.vehicle ? `${l.vehicle.brand} ${l.vehicle.model}` : vehicleLabel(l.vehicleId)}
                  </td>
                  <td className="text-xs">{l.partner?.name}</td>
                  <td>{l.city}</td>
                  <td className="font-mono text-xs">
                    {Number(l.pricePerDay).toLocaleString('fr-FR')} Ar
                  </td>
                  <td>
                    <span className="badge">{l.withDriver ? 'Chauffeur' : 'Self-drive'}</span>
                  </td>
                  <td className="text-center">{l.minDays}</td>
                  <td className="font-mono text-xs">
                    {Number(l.deposit) > 0
                      ? `${Number(l.deposit).toLocaleString('fr-FR')} Ar`
                      : '—'}
                  </td>
                  <td>
                    <span className={`badge ${l.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {l.isActive ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="flex gap-1 justify-end">
                    <button onClick={() => startEdit(l)} className="btn btn-sm btn-ghost">
                      Modifier
                    </button>
                    <button
                      onClick={() => remove(l.id)}
                      className="btn btn-sm btn-ghost text-danger-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
