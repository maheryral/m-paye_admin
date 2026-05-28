import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Edit3,
  Ban,
  Check,
  KeyRound,
  ChevronUp,
  ChevronDown,
  X,
  Crown,
  ArrowDown,
  FileStack,
} from 'lucide-react';
import { adminsApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

interface PermDef {
  code: string;
  label: string;
  description?: string;
}
interface PermGroup {
  domain: string;
  label: string;
  icon?: string;
  permissions: PermDef[];
}
interface Admin {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  isActive: boolean;
  adminLabel?: string | null;
  permissions: string[];
  twoFactorEnabled: boolean;
  createdAt: string;
}
interface Template {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

type Tab = 'list' | 'templates';

export default function Admins() {
  const [tab, setTab] = useState<Tab>('list');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Shield}
        title="Administrateurs & Permissions"
        subtitle="Créez des sous-admins avec des permissions granulaires"
      />

      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {(
          [
            { id: 'list', label: 'Administrateurs', icon: Users },
            { id: 'templates', label: 'Templates de permissions', icon: FileStack },
          ] as { id: Tab; label: string; icon: any }[]
        ).map((t2) => {
          const Icon = t2.icon;
          const isActive = tab === t2.id;
          return (
            <button
              key={t2.id}
              onClick={() => setTab(t2.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-brand text-white shadow-glow-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-bg-elevated/70'
              }`}
            >
              <Icon size={13} />
              {t2.label}
            </button>
          );
        })}
      </div>

      {tab === 'list' && <AdminsListTab />}
      {tab === 'templates' && <TemplatesTab />}
    </div>
  );
}

// ============================================================
// Tab 1 : Liste des admins
// ============================================================
function AdminsListTab() {
  const [items, setItems] = useState<Admin[]>([]);
  const [catalog, setCatalog] = useState<PermGroup[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, cat, tpls] = await Promise.all([
        adminsApi.list(),
        adminsApi.catalog(),
        adminsApi.listTemplates(),
      ]);
      setItems(list);
      setCatalog(cat.groups);
      setTemplates(tpls);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function toggleActive(a: Admin) {
    const verb = a.isActive ? 'désactiver' : 'réactiver';
    if (!confirm(`Confirmer : ${verb} ${a.prenom} ${a.nom} ?`)) return;
    try {
      await adminsApi.setActive(a.id, !a.isActive);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }
  async function promote(a: Admin) {
    if (
      !confirm(
        `⚠️ Promouvoir ${a.prenom} ${a.nom} en SUPER_ADMIN ?\nIl aura TOUS les droits sans restriction.`,
      )
    )
      return;
    await adminsApi.promote(a.id);
    load();
  }
  async function demote(a: Admin) {
    const perms = prompt(
      'Permissions à conserver (codes séparés par virgule, ex: kyc:list,kyc:approve)',
      'dashboard:view',
    );
    if (!perms) return;
    try {
      await adminsApi.demote(
        a.id,
        perms.split(',').map((p) => p.trim()).filter(Boolean),
      );
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }
  async function resetPwd(a: Admin) {
    const pwd = prompt(`Nouveau mot de passe pour ${a.prenom} ${a.nom} (min 12 car.) :`);
    if (!pwd) return;
    try {
      await adminsApi.resetPassword(a.id, pwd);
      alert('Mot de passe réinitialisé');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur');
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvel administrateur
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-ink-muted">Chargement…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Libellé</th>
                <th>Permissions</th>
                <th>2FA</th>
                <th>État</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">
                    {a.prenom} {a.nom}
                  </td>
                  <td className="text-ink-muted text-xs">{a.email}</td>
                  <td>
                    <span
                      className={
                        a.role === 'SUPER_ADMIN' ? 'badge-danger' : 'badge-info'
                      }
                    >
                      {a.role === 'SUPER_ADMIN' && (
                        <Crown size={9} className="inline" />
                      )}{' '}
                      {a.role}
                    </span>
                  </td>
                  <td className="text-ink-muted">
                    {a.adminLabel ?? (a.role === 'SUPER_ADMIN' ? '—' : 'Sans étiquette')}
                  </td>
                  <td>
                    {a.role === 'SUPER_ADMIN' ? (
                      <span className="text-xs text-ink-muted">
                        Tous droits (implicite)
                      </span>
                    ) : (
                      <span className="badge-info">
                        {a.permissions.length} perm.
                      </span>
                    )}
                  </td>
                  <td>
                    {a.twoFactorEnabled ? (
                      <ShieldCheck size={14} className="text-success-500" />
                    ) : (
                      <span className="text-xs text-ink-dim">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={a.isActive ? 'badge-success' : 'badge-danger'}
                    >
                      {a.isActive ? 'ACTIF' : 'INACTIF'}
                    </span>
                  </td>
                  <td className="space-x-1">
                    {a.role === 'ADMIN' && (
                      <button
                        onClick={() => setEditingId(a.id)}
                        className="btn btn-sm btn-secondary"
                        title="Éditer permissions"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => resetPwd(a)}
                      className="btn btn-sm btn-ghost"
                      title="Reset MDP"
                    >
                      <KeyRound size={12} />
                    </button>
                    {a.role === 'ADMIN' && (
                      <button
                        onClick={() => promote(a)}
                        className="btn btn-sm btn-ghost text-warning-500"
                        title="Promouvoir SUPER_ADMIN"
                      >
                        <ChevronUp size={12} />
                      </button>
                    )}
                    {a.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={() => demote(a)}
                        className="btn btn-sm btn-ghost"
                        title="Rétrograder en ADMIN"
                      >
                        <ArrowDown size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(a)}
                      className={`btn btn-sm ${a.isActive ? 'btn-danger' : 'btn-success'}`}
                      title={a.isActive ? 'Désactiver' : 'Réactiver'}
                    >
                      {a.isActive ? <Ban size={12} /> : <Check size={12} />}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-ink-muted">
                    Aucun admin
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateAdminModal
          catalog={catalog}
          templates={templates}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {editingId && (
        <EditPermissionsModal
          adminId={editingId}
          catalog={catalog}
          templates={templates}
          initial={items.find((a) => a.id === editingId) ?? null}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Modal : Créer un admin
// ============================================================
function CreateAdminModal({
  catalog,
  templates,
  onClose,
  onCreated,
}: {
  catalog: PermGroup[];
  templates: Template[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    adminLabel: '',
  });
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function applyTemplate(tId: string) {
    const t = templates.find((x) => x.id === tId);
    if (t) setPerms(new Set(t.permissions));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await adminsApi.create({
        ...form,
        permissions: Array.from(perms),
      });
      onCreated();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
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
        className="card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">Créer un sous-administrateur</div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
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
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              <label className="label">Mot de passe initial (min 12 car.)</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={12}
              />
            </div>
            <div>
              <label className="label">Libellé du rôle (ex: "Agent KYC")</label>
              <input
                className="input"
                value={form.adminLabel}
                onChange={(e) =>
                  setForm({ ...form, adminLabel: e.target.value })
                }
                placeholder="Agent KYC, Trésorerie…"
              />
            </div>
          </div>

          {/* Templates */}
          <div>
            <label className="label">Démarrer depuis un template (optionnel)</label>
            <select
              className="input"
              onChange={(e) => e.target.value && applyTemplate(e.target.value)}
              defaultValue=""
            >
              <option value="">— Choisir un template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isSystem && '(système)'} ·{' '}
                  {t.permissions.length} perm.
                </option>
              ))}
            </select>
          </div>

          <PermissionsGrid
            catalog={catalog}
            selected={perms}
            onChange={setPerms}
          />

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
              disabled={busy || perms.size === 0}
              className="btn btn-md btn-primary"
            >
              {busy ? 'Création…' : `Créer (${perms.size} perm.)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Modal : Édition permissions d'un admin existant
// ============================================================
function EditPermissionsModal({
  adminId,
  catalog,
  templates,
  initial,
  onClose,
  onSaved,
}: {
  adminId: string;
  catalog: PermGroup[];
  templates: Template[];
  initial: Admin | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [perms, setPerms] = useState<Set<string>>(
    new Set(initial?.permissions ?? []),
  );
  const [adminLabel, setAdminLabel] = useState(initial?.adminLabel ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function applyTemplate(tId: string) {
    const t = templates.find((x) => x.id === tId);
    if (t) setPerms(new Set(t.permissions));
  }

  async function save() {
    setErr(null);
    setBusy(true);
    try {
      await adminsApi.updatePermissions(
        adminId,
        Array.from(perms),
        adminLabel || undefined,
      );
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
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
        className="card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold">
              Permissions de {initial?.prenom} {initial?.nom}
            </div>
            <div className="text-xs text-ink-muted">{initial?.email}</div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Libellé du rôle</label>
            <input
              className="input"
              value={adminLabel}
              onChange={(e) => setAdminLabel(e.target.value)}
              placeholder="Agent KYC, Trésorerie…"
            />
          </div>
          <div>
            <label className="label">Appliquer un template</label>
            <select
              className="input"
              onChange={(e) => e.target.value && applyTemplate(e.target.value)}
              defaultValue=""
            >
              <option value="">— Choisir —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isSystem && '(système)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PermissionsGrid
          catalog={catalog}
          selected={perms}
          onChange={setPerms}
        />

        {err && (
          <div className="text-xs text-danger-400 bg-danger-bg p-2 rounded-lg mt-3">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-bg-border">
          <button onClick={onClose} className="btn btn-md btn-ghost">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="btn btn-md btn-primary"
          >
            {busy ? 'Sauvegarde…' : `Enregistrer (${perms.size} perm.)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Grille de sélection des permissions
// ============================================================
function PermissionsGrid({
  catalog,
  selected,
  onChange,
}: {
  catalog: PermGroup[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    return new Set(catalog.map((g) => g.domain));
  });

  function toggleGroup(domain: string) {
    const next = new Set(expanded);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);
    setExpanded(next);
  }

  function toggle(code: string) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(next);
  }

  function toggleGroupAll(group: PermGroup) {
    const codes = group.permissions.map((p) => p.code);
    const allSelected = codes.every((c) => selected.has(c));
    const next = new Set(selected);
    if (allSelected) codes.forEach((c) => next.delete(c));
    else codes.forEach((c) => next.add(c));
    onChange(next);
  }

  const totalSelected = useMemo(
    () =>
      catalog.reduce(
        (s, g) => s + g.permissions.filter((p) => selected.has(p.code)).length,
        0,
      ),
    [catalog, selected],
  );
  const totalAvailable = useMemo(
    () => catalog.reduce((s, g) => s + g.permissions.length, 0),
    [catalog],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold">
          Permissions ({totalSelected}/{totalAvailable})
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange(
                new Set(catalog.flatMap((g) => g.permissions.map((p) => p.code))),
              )
            }
            className="btn btn-sm btn-ghost text-xs"
          >
            Tout cocher
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="btn btn-sm btn-ghost text-xs"
          >
            Tout décocher
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {catalog.map((group) => {
          const isOpen = expanded.has(group.domain);
          const codes = group.permissions.map((p) => p.code);
          const selectedCount = codes.filter((c) => selected.has(c)).length;
          const allSelected = selectedCount === codes.length;
          return (
            <div
              key={group.domain}
              className="border border-bg-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center px-3 py-2 bg-bg-elevated">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => toggleGroupAll(group)}
                  className="mr-2"
                />
                <button
                  type="button"
                  onClick={() => toggleGroup(group.domain)}
                  className="flex-1 flex items-center justify-between text-sm font-semibold"
                >
                  <span>
                    {group.label}{' '}
                    <span className="text-xs text-ink-muted font-normal">
                      ({selectedCount}/{codes.length})
                    </span>
                  </span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3">
                  {group.permissions.map((p) => {
                    const checked = selected.has(p.code);
                    return (
                      <label
                        key={p.code}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          checked
                            ? 'bg-brand-500/15 border border-brand-500/30'
                            : 'hover:bg-bg-elevated/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.code)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold">{p.label}</div>
                          <div className="text-[10px] font-mono text-ink-dim truncate">
                            {p.code}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Tab 2 : Templates de permissions
// ============================================================
function TemplatesTab() {
  const [items, setItems] = useState<Template[]>([]);
  const [catalog, setCatalog] = useState<PermGroup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);

  async function load() {
    const [tpls, cat] = await Promise.all([
      adminsApi.listTemplates(),
      adminsApi.catalog(),
    ]);
    setItems(tpls);
    setCatalog(cat.groups);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(t: Template) {
    if (t.isSystem) {
      alert('Template système non supprimable');
      return;
    }
    if (!confirm(`Supprimer le template "${t.name}" ?`)) return;
    await adminsApi.deleteTemplate(t.id);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouveau template
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-sm">{t.name}</div>
                {t.isSystem && (
                  <span className="badge-info text-[9px] mt-1 inline-block">
                    SYSTÈME
                  </span>
                )}
              </div>
              <span className="badge-info">{t.permissions.length}</span>
            </div>
            {t.description && (
              <div className="text-xs text-ink-muted mb-3">
                {t.description}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {t.permissions.slice(0, 5).map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-mono px-1.5 py-0.5 bg-bg-elevated rounded"
                >
                  {p}
                </span>
              ))}
              {t.permissions.length > 5 && (
                <span className="text-[10px] text-ink-muted">
                  +{t.permissions.length - 5}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!t.isSystem && (
                <button
                  onClick={() => {
                    setEditing(t);
                    setShowForm(true);
                  }}
                  className="btn btn-sm btn-secondary flex-1"
                >
                  <Edit3 size={12} /> Éditer
                </button>
              )}
              {!t.isSystem && (
                <button
                  onClick={() => remove(t)}
                  className="btn btn-sm btn-ghost text-danger-400"
                >
                  <X size={12} />
                </button>
              )}
              {t.isSystem && (
                <button
                  onClick={() => {
                    setEditing({
                      ...t,
                      id: '',
                      name: `${t.name} (copie)`,
                      isSystem: false,
                    });
                    setShowForm(true);
                  }}
                  className="btn btn-sm btn-secondary flex-1"
                >
                  Dupliquer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TemplateForm
          catalog={catalog}
          initial={editing}
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
    </div>
  );
}

function TemplateForm({
  catalog,
  initial,
  onClose,
  onSaved,
}: {
  catalog: PermGroup[];
  initial: Template | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [perms, setPerms] = useState<Set<string>>(
    new Set(initial?.permissions ?? []),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await adminsApi.upsertTemplate({
        id: initial?.id || undefined,
        name,
        description,
        permissions: Array.from(perms),
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erreur');
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
        className="card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">
            {initial?.id ? 'Éditer template' : 'Nouveau template'}
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Accès lecture + validation KYC"
            />
          </div>

          <PermissionsGrid
            catalog={catalog}
            selected={perms}
            onChange={setPerms}
          />

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
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !name || perms.size === 0}
              className="btn btn-md btn-primary"
            >
              {busy ? 'Sauvegarde…' : `Enregistrer (${perms.size} perm.)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
