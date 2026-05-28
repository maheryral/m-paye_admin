import api from './api';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; prenom: string; nom: string; role: string };
}

export interface ChatParticipant {
  id: string;
  userId: string;
  lastReadAt: string | null;
  user: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    role: string;
  };
}

export interface Conversation {
  id: string;
  type: 'PRIVATE' | 'SUPPORT' | 'GROUP';
  title?: string | null;
  lastMessageAt?: string | null;
  status?: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedAgentId?: string | null;
  closedAt?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  participants: ChatParticipant[];
  messages?: ChatMessage[];
  unreadCount?: number;
}

export const messagingApi = {
  listConversations: () =>
    api.get<Conversation[]>('/messaging/conversations').then((r) => r.data),

  getConversation: (id: string) =>
    api
      .get<Conversation>(`/messaging/conversations/${id}`)
      .then((r) => r.data),

  listMessages: (id: string, page = 1, limit = 100) =>
    api
      .get<ChatMessage[]>(`/messaging/conversations/${id}/messages`, {
        params: { page, limit },
      })
      .then((r) => r.data),

  sendMessage: (id: string, content: string) =>
    api
      .post<ChatMessage>(`/messaging/conversations/${id}/messages`, { content })
      .then((r) => r.data),

  markRead: (id: string) =>
    api.patch(`/messaging/conversations/${id}/read`).then((r) => r.data),

  // Support : file d'attente + cycle de vie
  supportQueue: () =>
    api
      .get<{ queue: Conversation[]; mine: Conversation[] }>(
        '/messaging/support/queue',
      )
      .then((r) => r.data),

  claim: (id: string) =>
    api.post<Conversation>(`/messaging/conversations/${id}/claim`).then((r) => r.data),

  close: (id: string) =>
    api.patch<Conversation>(`/messaging/conversations/${id}/close`).then((r) => r.data),
};
