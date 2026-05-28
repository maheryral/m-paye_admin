import { useEffect, useState } from 'react';
import {
  MessageSquare,
  FileText,
  Clock,
  LifeBuoy,
  Plus,
  Save,
  Trash2,
  Send,
  X,
} from 'lucide-react';
import { commsApi } from '../services/superAdminApi';
import PageHeader from '../components/ui/PageHeader';

type Tab = 'tickets' | 'templates' | 'scheduled';

export default function Comms() {
  const [tab, setTab] = useState<Tab>('tickets');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="Communications"
        subtitle="Tickets support, templates de notif, planification d'envois"
      />

      <div className="flex flex-wrap gap-1.5 p-1 bg-bg-elevated/40 rounded-2xl border border-bg-border w-fit">
        {(
          [
            { id: 'tickets', label: 'Tickets support', icon: LifeBuoy },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'scheduled', label: 'Notifications planifiées', icon: Clock },
          ] as { id: Tab; label: string; icon: any }[]
        ).map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive
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

      {tab === 'tickets' && <TicketsTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'scheduled' && <ScheduledTab />}
    </div>
  );
}

function TicketsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState('OPEN');
  const [opened, setOpened] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);

  async function load() {
    const [list, s] = await Promise.all([
      commsApi.listTickets({ status, limit: 100 }),
      commsApi.ticketsStats(),
    ]);
    setItems(list.items);
    setStats(s);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function open(id: string) {
    const t = await commsApi.getTicket(id);
    setOpened(t);
  }

  async function send() {
    if (!opened || reply.trim().length < 1) return;
    await commsApi.addMessage(opened.id, { body: reply, isInternal: internal });
    setReply('');
    setInternal(false);
    open(opened.id);
    load();
  }

  async function setS(id: string, newStatus: string) {
    await commsApi.setTicketStatus(id, newStatus);
    if (opened) open(opened.id);
    load();
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Mini label="Ouverts" value={stats?.open ?? 0} tone="danger" />
        <Mini label="En attente" value={stats?.pending ?? 0} tone="warning" />
        <Mini label="Résolus" value={stats?.resolved ?? 0} tone="success" />
        <Mini label="Clôturés" value={stats?.closed ?? 0} tone="brand" />
      </div>

      <div className="flex gap-2 mb-4">
        {['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Sujet</th>
              <th>User</th>
              <th>Cat.</th>
              <th>Priorité</th>
              <th>Msgs</th>
              <th>Créé</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr
                key={t.id}
                onClick={() => open(t.id)}
                className="cursor-pointer"
              >
                <td className="font-mono text-xs">{t.reference}</td>
                <td className="font-semibold">{t.subject}</td>
                <td className="text-xs">
                  {t.user ? `${t.user.prenom} ${t.user.nom}` : '—'}
                </td>
                <td>
                  <span className="badge-info">{t.category}</span>
                </td>
                <td>
                  <span
                    className={
                      t.priority === 'URGENT' || t.priority === 'HIGH'
                        ? 'badge-danger'
                        : t.priority === 'NORMAL'
                          ? 'badge-info'
                          : 'badge-success'
                    }
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="text-ink-muted">{t._count?.messages ?? 0}</td>
                <td className="text-ink-muted text-xs">
                  {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  <button className="btn btn-sm btn-secondary">Ouvrir</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-ink-muted">
                  Aucun ticket
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {opened && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setOpened(null)}
        >
          <div
            className="card max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-bg-border flex items-start justify-between">
              <div>
                <div className="text-xs text-ink-dim font-mono">
                  {opened.reference}
                </div>
                <div className="text-lg font-bold mt-1">{opened.subject}</div>
                <div className="text-xs text-ink-muted">
                  {opened.user?.prenom} {opened.user?.nom} ·{' '}
                  {opened.user?.email}
                </div>
              </div>
              <button
                onClick={() => setOpened(null)}
                className="text-ink-dim hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {opened.messages.map((m: any) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-sm ${
                    m.authorRole === 'USER'
                      ? 'bg-bg-elevated mr-8'
                      : m.isInternal
                        ? 'bg-warning-bg/30 ml-8 border border-warning-500/30'
                        : 'bg-brand-500/15 ml-8'
                  }`}
                >
                  <div className="text-[10px] text-ink-dim uppercase tracking-wider font-bold mb-1">
                    {m.authorRole}{' '}
                    {m.isInternal && (
                      <span className="text-warning-500">· INTERNE</span>
                    )}{' '}
                    · {new Date(m.createdAt).toLocaleString('fr-FR')}
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-bg-border space-y-3">
              <div className="flex gap-2 flex-wrap">
                {['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setS(opened.id, s)}
                    disabled={opened.status === s}
                    className={`btn btn-sm ${opened.status === s ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                className="input min-h-[80px]"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Votre réponse…"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => setInternal(e.target.checked)}
                  />
                  Note interne (invisible pour le user)
                </label>
                <button
                  onClick={send}
                  disabled={reply.trim().length < 1}
                  className="btn btn-md btn-primary"
                >
                  <Send size={14} /> Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [channel, setChannel] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    code: '',
    channel: 'EMAIL',
    locale: 'fr',
    subject: '',
    body: '',
    variables: '',
    isActive: true,
  });

  async function load() {
    setItems(await commsApi.listTemplates({ channel: channel || undefined }));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await commsApi.upsertTemplate(form);
    setShow(false);
    setForm({
      code: '',
      channel: 'EMAIL',
      locale: 'fr',
      subject: '',
      body: '',
      variables: '',
      isActive: true,
    });
    load();
  }

  async function edit(t: any) {
    setForm(t);
    setShow(true);
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce template ?')) return;
    await commsApi.deleteTemplate(id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          className="input w-auto"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="">Tous channels</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="PUSH">Push</option>
          <option value="IN_APP">In-app</option>
        </select>
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary ml-auto"
        >
          <Plus size={14} /> Nouveau template
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Code</label>
              <input
                className="input font-mono"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Channel</label>
              <select
                className="input"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">PUSH</option>
                <option value="IN_APP">IN_APP</option>
              </select>
            </div>
            <div>
              <label className="label">Locale</label>
              <select
                className="input"
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
              >
                <option value="fr">fr</option>
                <option value="en">en</option>
                <option value="mg">mg</option>
              </select>
            </div>
          </div>
          {form.channel === 'EMAIL' && (
            <div>
              <label className="label">Sujet (EMAIL)</label>
              <input
                className="input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label">
              Corps (variables : {`{{name}} {{amount}}`}…)
            </label>
            <textarea
              className="input min-h-[150px] font-mono text-xs"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Variables disponibles (CSV)</label>
            <input
              className="input font-mono"
              value={form.variables}
              onChange={(e) => setForm({ ...form, variables: e.target.value })}
              placeholder="name,amount,reference"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Code</th>
              <th>Channel</th>
              <th>Locale</th>
              <th>Sujet</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td className="font-mono text-xs">{t.code}</td>
                <td>
                  <span className="badge-info">{t.channel}</span>
                </td>
                <td className="text-ink-muted">{t.locale}</td>
                <td className="max-w-xs truncate">{t.subject || '—'}</td>
                <td>
                  <span
                    className={t.isActive ? 'badge-success' : 'badge-danger'}
                  >
                    {t.isActive ? 'OUI' : 'NON'}
                  </span>
                </td>
                <td className="space-x-1">
                  <button
                    onClick={() => edit(t)}
                    className="btn btn-sm btn-secondary"
                  >
                    Éditer
                  </button>
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
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucun template
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduledTab() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('SCHEDULED');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({
    title: '',
    message: '',
    body: '',
    audience: 'ALL',
    priority: 'NORMAL',
    icon: 'megaphone',
    color: '#5B52E8',
    scheduledFor: '',
  });

  async function load() {
    setItems(await commsApi.listScheduled(status));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await commsApi.createScheduled(form);
    setShow(false);
    setForm({
      title: '',
      message: '',
      body: '',
      audience: 'ALL',
      priority: 'NORMAL',
      icon: 'megaphone',
      color: '#5B52E8',
      scheduledFor: '',
    });
    load();
  }

  async function cancel(id: string) {
    if (!confirm('Annuler cette planification ?')) return;
    await commsApi.cancelScheduled(id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['SCHEDULED', 'SENT', 'CANCELLED', 'FAILED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setShow((v) => !v)}
          className="btn btn-md btn-primary ml-auto"
        >
          <Plus size={14} /> Planifier
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="card p-5 mb-4 space-y-3">
          <div>
            <label className="label">Titre</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={191}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <input
              className="input"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              maxLength={191}
            />
          </div>
          <div>
            <label className="label">Corps détaillé</label>
            <textarea
              className="input"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Audience</label>
              <select
                className="input"
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              >
                <option value="ALL">Tous</option>
                <option value="USERS">Users</option>
                <option value="MERCHANTS">Marchands</option>
                <option value="ADMINS">Admins</option>
              </select>
            </div>
            <div>
              <label className="label">Priorité</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
            <div>
              <label className="label">Envoyer le</label>
              <input
                type="datetime-local"
                className="input"
                value={form.scheduledFor}
                onChange={(e) =>
                  setForm({ ...form, scheduledFor: e.target.value })
                }
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-md btn-primary">
            <Save size={14} /> Planifier
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Date prévue</th>
              <th>Titre</th>
              <th>Audience</th>
              <th>Statut</th>
              <th>Envoyés</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td className="text-xs">
                  {new Date(s.scheduledFor).toLocaleString('fr-FR')}
                </td>
                <td>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-ink-muted">{s.message}</div>
                </td>
                <td>
                  <span className="badge-info">{s.audience}</span>
                </td>
                <td>
                  <span
                    className={
                      s.status === 'SENT'
                        ? 'badge-success'
                        : s.status === 'CANCELLED' || s.status === 'FAILED'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }
                  >
                    {s.status}
                  </span>
                </td>
                <td>{s.sentCount}</td>
                <td>
                  {s.status === 'SCHEDULED' && (
                    <button
                      onClick={() => cancel(s.id)}
                      className="btn btn-sm btn-ghost text-danger-400"
                    >
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-ink-muted">
                  Aucune planification
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-ink-dim">
        ℹ️ Le worker d'envoi (cron) doit consommer cette table et déclencher
        l'envoi quand <code className="font-mono">scheduledFor &lt;= now()</code>{' '}
        et <code className="font-mono">status = SCHEDULED</code>.
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
