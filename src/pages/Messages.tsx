import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  MessageCircle,
  Send,
  Search,
  Headset,
  RefreshCw,
} from 'lucide-react';
import { messagingApi, Conversation, ChatMessage } from '../services/messagingApi';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/env';
import { secureStorage } from '../services/storage';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

function fmtTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday)
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtFullTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await messagingApi.listConversations();
      // SUPPORT en premier, trié par dernière activité
      const sorted = [...list].sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });
      setConversations(sorted);
      if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadMessages = useCallback(async (id: string) => {
    setLoadingMsgs(true);
    try {
      const msgs = await messagingApi.listMessages(id, 1, 200);
      setMessages(msgs);
      await messagingApi.markRead(id);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket temps réel (namespace /notifications, event "message:new")
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await secureStorage.getItem('accessToken');
      if (!token || cancelled) return;

      const socket = io(`${API_BASE_URL}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('connect_error', () => setSocketConnected(false));

      socket.on(
        'message:new',
        (payload: { conversationId: string; message: ChatMessage }) => {
          // Si la conversation est ouverte → on append le message en direct
          if (selectedIdRef.current === payload.conversationId) {
            setMessages((prev) =>
              prev.some((m) => m.id === payload.message.id)
                ? prev
                : [...prev, payload.message],
            );
            // Et on marque comme lu pour rester clean
            messagingApi.markRead(payload.conversationId).catch(() => {});
          }
          // Rafraîchit la liste (dernière activité + unread sur les autres conversations)
          loadList();
        },
      );

      socketRef.current = socket;
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const msg = await messagingApi.sendMessage(selectedId, draft.trim());
      setMessages((m) => [...m, msg]);
      setDraft('');
      loadList();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }

  function getTitle(c: Conversation) {
    if (c.type === 'SUPPORT') {
      const requester = c.participants.find(
        (p) => p.user.role === 'USER',
      )?.user;
      return requester
        ? `${requester.prenom} ${requester.nom}`.trim() || 'Utilisateur'
        : c.title || 'Support';
    }
    const other = c.participants.find((p) => p.userId !== user?.id)?.user;
    return other ? `${other.prenom} ${other.nom}`.trim() : 'Conversation';
  }

  function getSubtitle(c: Conversation) {
    if (c.type === 'SUPPORT') {
      const requester = c.participants.find(
        (p) => p.user.role === 'USER',
      )?.user;
      return requester?.email ?? '—';
    }
    return '';
  }

  function getInitials(c: Conversation) {
    const requester =
      c.type === 'SUPPORT'
        ? c.participants.find((p) => p.user.role === 'USER')?.user
        : c.participants.find((p) => p.userId !== user?.id)?.user;
    if (!requester) return 'SP';
    return `${requester.prenom?.[0] || ''}${requester.nom?.[0] || ''}`.toUpperCase();
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return conversations;
    const s = q.toLowerCase();
    return conversations.filter((c) => {
      const title = getTitle(c).toLowerCase();
      const sub = getSubtitle(c).toLowerCase();
      return title.includes(s) || sub.includes(s);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, q]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={MessageCircle}
        title="Messages"
        subtitle="Conversations support avec les utilisateurs"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
                socketConnected
                  ? 'bg-success-bg/60 border-success-500/30 text-success-500'
                  : 'bg-bg-elevated/60 border-bg-border text-ink-dim'
              }`}
              title={socketConnected ? 'Temps réel actif' : 'Hors ligne'}
            >
              <span
                className={socketConnected ? 'dot-live' : 'dot bg-ink-dim/40'}
              />
              <span className="font-semibold">
                {socketConnected ? 'Live' : 'Offline'}
              </span>
            </span>
            <button
              onClick={loadList}
              className="btn btn-md btn-secondary"
              title="Rafraîchir"
            >
              <RefreshCw size={14} /> Rafraîchir
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Liste */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-bg-border/60">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none"
              />
              <input
                className="input pl-9"
                placeholder="Rechercher…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="Aucune conversation"
                description="Les messages des utilisateurs apparaîtront ici."
              />
            ) : (
              <ul className="divide-y divide-bg-border/60">
                {filtered.map((c) => {
                  const isActive = c.id === selectedId;
                  const unread = c.unreadCount ?? 0;
                  const last = c.messages?.[0];
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full text-left p-3 flex gap-3 items-start hover:bg-bg-elevated/50 transition ${
                          isActive ? 'bg-bg-elevated/70' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow-soft">
                          {c.type === 'SUPPORT' ? (
                            <Headset size={16} />
                          ) : (
                            getInitials(c)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold truncate flex-1">
                              {getTitle(c)}
                            </div>
                            <div className="text-[10px] text-ink-dim shrink-0">
                              {fmtTime(c.lastMessageAt)}
                            </div>
                          </div>
                          <div className="text-[11px] text-ink-dim truncate">
                            {getSubtitle(c)}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {last && (
                              <div className="text-xs text-ink-muted truncate flex-1">
                                {last.content}
                              </div>
                            )}
                            {unread > 0 && (
                              <span className="bg-danger-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="card overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageCircle}
                title="Sélectionnez une conversation"
                description="Choisissez une discussion à gauche pour répondre."
              />
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-bg-border/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-glow-soft">
                  {selected.type === 'SUPPORT' ? (
                    <Headset size={16} />
                  ) : (
                    getInitials(selected)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{getTitle(selected)}</div>
                  <div className="text-[11px] text-ink-dim truncate">
                    {getSubtitle(selected)}
                  </div>
                </div>
                <span className="badge-info">
                  {selected.type === 'SUPPORT' ? 'Support' : 'Privée'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-bg-base/30">
                {loadingMsgs ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton h-10 rounded-xl" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-ink-dim py-10">
                    Aucun message
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            mine
                              ? 'bg-gradient-brand text-white rounded-br-md'
                              : 'bg-bg-elevated/80 border border-bg-border/60 rounded-bl-md'
                          }`}
                        >
                          {!mine && m.sender && (
                            <div className="text-[10px] font-bold mb-0.5 opacity-70">
                              {m.sender.prenom} {m.sender.nom}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          <div
                            className={`text-[10px] mt-1 ${
                              mine ? 'text-white/70' : 'text-ink-dim'
                            }`}
                          >
                            {fmtFullTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="border-t border-bg-border/60 p-3 flex gap-2"
              >
                <input
                  className="input flex-1"
                  placeholder="Tapez votre réponse…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="btn btn-md btn-primary"
                >
                  <Send size={14} /> Envoyer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
