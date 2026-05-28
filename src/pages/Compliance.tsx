import { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Gauge,
  Search as SearchIcon,
  FileText,
  Play,
  Trash2,
  Plus,
  FileWarning,
} from 'lucide-react';
import { complianceApi } from '../services/superAdminApi';
import { useT } from '../contexts/LocaleContext';
import PageHeader from '../components/ui/PageHeader';

type Tab = 'risk' | 'velocity' | 'sanctions' | 'activities' | 'reports';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'activities', label: 'Alertes', icon: AlertTriangle },
  { id: 'risk', label: 'Score de risque', icon: Gauge },
  { id: 'velocity', label: 'Limites vélocité', icon: ShieldAlert },
  { id: 'sanctions', label: 'Sanctions', icon: SearchIcon },
  { id: 'reports', label: 'Rapports', icon: FileWarning },
];

export default function Compliance() {
  const [tab, setTab] = useState<Tab>('activities');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={ShieldAlert}
        title="Conformité & Anti-fraude (AML)"
        subtitle="Détection, scoring, listes de sanctions, déclarations SAMIFIN"
      />

      {/* Tabs premium en pills connectées */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {TABS.map((tab2) => {
          const Icon = tab2.icon;
          const isActive = tab === tab2.id;
          return (
            <button
              key={tab2.id}
              onClick={() => setTab(tab2.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-brand text-white shadow-glow-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-bg-elevated/70'
              }`}
            >
              <Icon size={13} />
              {tab2.label}
            </button>
          );
        })}
      </div>

      {tab === 'activities' && <ActivitiesTab />}
      {tab === 'risk' && <RiskTab />}
      {tab === 'velocity' && <VelocityTab />}
      {tab === 'sanctions' && <SanctionsTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  );
}

// ============================================================
// Tab 1: Alertes (Suspicious Activities)
// ============================================================
function ActivitiesTab() {
  const t = useT();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState('OPEN');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [list, s] = await Promise.all([
      complianceApi.activitiesList({ status, page: 1, limit: 100 }),
      complianceApi.activitiesStats(),
    ]);
    setItems(list.items);
    setStats(s);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function runScan() {
    setBusy(true);
    try {
      const res = await complianceApi.runScan(7);
      alert(`Scan terminé : ${res.detected} nouvelle(s) alerte(s) détectée(s)`);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function setActivityStatus(id: string, newStatus: string) {
    const note = prompt('Note de revue (optionnel) :') ?? undefined;
    await complianceApi.updateActivity(id, { status: newStatus, reviewNote: note });
    load();
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Mini label="Ouvertes" value={stats?.open ?? 0} tone="danger" />
        <Mini label="En revue" value={stats?.reviewing ?? 0} tone="warning" />
        <Mini label="Clôturées" value={stats?.cleared ?? 0} tone="success" />
        <Mini label="Reportées" value={stats?.reported ?? 0} tone="brand" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['OPEN', 'REVIEWING', 'CLEARED', 'REPORTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={runScan}
          disabled={busy}
          className="btn btn-sm btn-secondary ml-auto"
        >
          <Play size={12} />
          {busy ? t('common.loading') : 'Scanner les 7 derniers jours'}
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Règle</th>
              <th>Sévérité</th>
              <th>Détails</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucune alerte
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td className="text-xs text-ink-muted">
                    {new Date(it.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td>
                    {it.user ? (
                      <>
                        <div className="font-semibold">
                          {it.user.prenom} {it.user.nom}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {it.user.email}
                        </div>
                      </>
                    ) : (
                      <span className="text-ink-dim font-mono text-xs">
                        {it.userId}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-xs px-2 py-0.5 bg-brand-500/10 text-brand-300 rounded">
                      {it.ruleCode}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        it.severity === 'CRITICAL'
                          ? 'badge-danger'
                          : it.severity === 'HIGH'
                            ? 'badge-warning'
                            : 'badge-info'
                      }
                    >
                      {it.severity}
                    </span>
                  </td>
                  <td className="text-xs text-ink-muted max-w-xs truncate">
                    {it.details}
                  </td>
                  <td className="text-right space-x-1">
                    {it.status === 'OPEN' && (
                      <button
                        onClick={() => setActivityStatus(it.id, 'REVIEWING')}
                        className="btn btn-sm btn-secondary"
                      >
                        Examiner
                      </button>
                    )}
                    {it.status !== 'CLEARED' && (
                      <button
                        onClick={() => setActivityStatus(it.id, 'CLEARED')}
                        className="btn btn-sm btn-success"
                      >
                        Clôturer
                      </button>
                    )}
                    {it.status !== 'REPORTED' && (
                      <button
                        onClick={() => setActivityStatus(it.id, 'REPORTED')}
                        className="btn btn-sm btn-danger"
                      >
                        Reporter
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Risk scoring
// ============================================================
function RiskTab() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [level, setLevel] = useState('');

  async function load() {
    const [list, s] = await Promise.all([
      complianceApi.riskList({ level: level || undefined, limit: 50 }),
      complianceApi.riskStats(),
    ]);
    setItems(list.items);
    setStats(s);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Mini label="LOW" value={stats?.low ?? 0} tone="success" />
        <Mini label="MEDIUM" value={stats?.medium ?? 0} tone="warning" />
        <Mini label="HIGH" value={stats?.high ?? 0} tone="danger" />
        <Mini label="CRITICAL" value={stats?.critical ?? 0} tone="danger" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`btn btn-sm ${level === l ? 'btn-primary' : 'btn-secondary'}`}
          >
            {l || 'Tous'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Score</th>
              <th>Niveau</th>
              <th>Facteurs</th>
              <th>Calculé le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              let factors: any[] = [];
              try {
                factors = JSON.parse(r.factors ?? '[]');
              } catch {
                factors = [];
              }
              return (
                <tr key={r.id}>
                  <td>
                    {r.user ? (
                      <>
                        <div className="font-semibold">
                          {r.user.prenom} {r.user.nom}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {r.user.email}
                        </div>
                      </>
                    ) : (
                      <span className="text-ink-dim font-mono text-xs">
                        {r.userId}
                      </span>
                    )}
                  </td>
                  <td className="font-bold text-lg">{r.score}/100</td>
                  <td>
                    <span
                      className={
                        r.level === 'CRITICAL' || r.level === 'HIGH'
                          ? 'badge-danger'
                          : r.level === 'MEDIUM'
                            ? 'badge-warning'
                            : 'badge-success'
                      }
                    >
                      {r.level}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {factors.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 bg-bg-elevated rounded"
                          title={`+${f.points}`}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-ink-muted text-xs">
                    {new Date(r.lastComputedAt).toLocaleString('fr-FR')}
                  </td>
                  <td>
                    <button
                      onClick={async () => {
                        await complianceApi.recomputeRisk(r.userId);
                        load();
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      Recalculer
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucun score (lancer un recalcul depuis la fiche user)
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
// Tab 3: Velocity limits
// ============================================================
function VelocityTab() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    scope: 'GLOBAL',
    scopeId: '',
    type: 'TRANSFER',
    currency: 'MGA',
    perTransaction: '',
    perDay: '',
    perWeek: '',
    perMonth: '',
  });

  async function load() {
    const list = await complianceApi.velocityList();
    setItems(list);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await complianceApi.createVelocity({
      ...form,
      scopeId: form.scope === 'GLOBAL' ? undefined : form.scopeId,
      perTransaction: form.perTransaction ? Number(form.perTransaction) : undefined,
      perDay: form.perDay ? Number(form.perDay) : undefined,
      perWeek: form.perWeek ? Number(form.perWeek) : undefined,
      perMonth: form.perMonth ? Number(form.perMonth) : undefined,
    });
    setShowForm(false);
    setForm({
      scope: 'GLOBAL',
      scopeId: '',
      type: 'TRANSFER',
      currency: 'MGA',
      perTransaction: '',
      perDay: '',
      perWeek: '',
      perMonth: '',
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette limite ?')) return;
    await complianceApi.removeVelocity(id);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Nouvelle limite
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Portée</label>
              <select
                className="input"
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
              >
                <option value="GLOBAL">GLOBAL (tous)</option>
                <option value="ROLE">ROLE</option>
                <option value="USER">USER spécifique</option>
                <option value="KYC_LEVEL">KYC LEVEL</option>
              </select>
            </div>
            {form.scope !== 'GLOBAL' && (
              <div>
                <label className="label">Cible (ID/code)</label>
                <input
                  className="input"
                  value={form.scopeId}
                  onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
                  placeholder={
                    form.scope === 'ROLE'
                      ? 'ex: USER'
                      : form.scope === 'KYC_LEVEL'
                        ? 'ex: BASIC'
                        : 'userId'
                  }
                />
              </div>
            )}
            <div>
              <label className="label">Type opération</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="DEPOSIT">DEPOSIT</option>
                <option value="WITHDRAWAL">WITHDRAWAL</option>
                <option value="PAYMENT">PAYMENT</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Par transaction</label>
              <input
                type="number"
                className="input"
                value={form.perTransaction}
                onChange={(e) => setForm({ ...form, perTransaction: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Par jour</label>
              <input
                type="number"
                className="input"
                value={form.perDay}
                onChange={(e) => setForm({ ...form, perDay: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Par semaine</label>
              <input
                type="number"
                className="input"
                value={form.perWeek}
                onChange={(e) => setForm({ ...form, perWeek: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Par mois</label>
              <input
                type="number"
                className="input"
                value={form.perMonth}
                onChange={(e) => setForm({ ...form, perMonth: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            Créer la limite
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Portée</th>
              <th>Type</th>
              <th>Par tx</th>
              <th>Par jour</th>
              <th>Par semaine</th>
              <th>Par mois</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td>
                  <div className="font-semibold">{v.scope}</div>
                  {v.scopeId && (
                    <div className="text-xs text-ink-muted font-mono">
                      {v.scopeId}
                    </div>
                  )}
                </td>
                <td>{v.type}</td>
                <td>{v.perTransaction ?? '—'}</td>
                <td>{v.perDay ?? '—'}</td>
                <td>{v.perWeek ?? '—'}</td>
                <td>{v.perMonth ?? '—'}</td>
                <td>
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
                  Aucune limite configurée
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
// Tab 4: Sanctions list
// ============================================================
function SanctionsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    aliases: '',
    type: 'INDIVIDUAL',
    source: 'OFAC',
    reason: '',
    countryCode: '',
  });

  async function load() {
    const list = await complianceApi.sanctionsList({
      q: q || undefined,
      source: source || undefined,
      limit: 100,
    });
    setItems(list.items);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, source]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await complianceApi.addSanction(form);
    setShowForm(false);
    setForm({
      fullName: '',
      aliases: '',
      type: 'INDIVIDUAL',
      source: 'OFAC',
      reason: '',
      countryCode: '',
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette entrée ?')) return;
    await complianceApi.removeSanction(id);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Rechercher un nom…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-auto"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">Toutes sources</option>
          <option value="OFAC">OFAC</option>
          <option value="EU">EU</option>
          <option value="UN">UN</option>
          <option value="GAFI">GAFI</option>
          <option value="SAMIFIN">SAMIFIN</option>
          <option value="INTERNAL">Interne</option>
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nom complet</label>
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Alias (séparés par |)</label>
              <input
                className="input"
                value={form.aliases}
                onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                placeholder="alias 1|alias 2"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="INDIVIDUAL">INDIVIDUAL</option>
                <option value="ENTITY">ENTITY</option>
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <option value="OFAC">OFAC</option>
                <option value="EU">EU</option>
                <option value="UN">UN</option>
                <option value="GAFI">GAFI</option>
                <option value="SAMIFIN">SAMIFIN</option>
                <option value="INTERNAL">Interne</option>
              </select>
            </div>
            <div>
              <label className="label">Pays (ISO3)</label>
              <input
                className="input uppercase"
                value={form.countryCode}
                onChange={(e) =>
                  setForm({ ...form, countryCode: e.target.value.toUpperCase() })
                }
                maxLength={3}
              />
            </div>
            <div>
              <label className="label">Motif</label>
              <input
                className="input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-danger">
            Ajouter à la liste
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Source</th>
              <th>Pays</th>
              <th>Ajouté le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="font-semibold">{s.fullName}</div>
                  {s.aliases && (
                    <div className="text-xs text-ink-muted">{s.aliases}</div>
                  )}
                </td>
                <td>
                  <span className="badge-info">{s.type}</span>
                </td>
                <td>
                  <span className="badge-danger">{s.source}</span>
                </td>
                <td className="font-mono">{s.countryCode ?? '—'}</td>
                <td className="text-ink-muted text-xs">
                  {new Date(s.addedAt).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  <button
                    onClick={() => remove(s.id)}
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
                  Aucune entrée
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
// Tab 5: AML Reports (SAR/STR/CTR)
// ============================================================
function ReportsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'SAR',
    userId: '',
    summary: '',
    totalAmount: '',
    currency: 'MGA',
  });

  async function load() {
    const list = await complianceApi.reportsList({ limit: 100 });
    setItems(list.items);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await complianceApi.createReport({
      ...form,
      totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
    });
    setShowForm(false);
    setForm({ type: 'SAR', userId: '', summary: '', totalAmount: '', currency: 'MGA' });
    load();
  }

  async function file(id: string) {
    const ref = prompt('Référence externe SAMIFIN (optionnel) :') ?? undefined;
    await complianceApi.fileReport(id, ref || undefined);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-md btn-primary"
        >
          <FileText size={14} /> Nouveau rapport
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="SAR">SAR (Suspicious Activity)</option>
                <option value="STR">STR (Transaction)</option>
                <option value="CTR">CTR (Cash)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">User ID concerné</label>
              <input
                className="input font-mono"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Résumé</label>
            <textarea
              className="input min-h-[100px]"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant total</label>
              <input
                type="number"
                className="input"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Devise</label>
              <input
                className="input"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            Créer le rapport (DRAFT)
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Type</th>
              <th>User</th>
              <th>Statut</th>
              <th>Montant</th>
              <th>Créé le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.reference}</td>
                <td>
                  <span className="badge-danger">{r.type}</span>
                </td>
                <td>
                  {r.user
                    ? `${r.user.prenom} ${r.user.nom}`
                    : <span className="text-ink-dim text-xs">{r.userId}</span>}
                </td>
                <td>
                  <span
                    className={
                      r.status === 'FILED'
                        ? 'badge-success'
                        : r.status === 'ACK'
                          ? 'badge-info'
                          : 'badge-warning'
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.totalAmount
                    ? `${Number(r.totalAmount).toLocaleString('fr-FR')} ${r.currency}`
                    : '—'}
                </td>
                <td className="text-ink-muted text-xs">
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  {r.status === 'DRAFT' && (
                    <button
                      onClick={() => file(r.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Déposer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-ink-muted">
                  Aucun rapport
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
