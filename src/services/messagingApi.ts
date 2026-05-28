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
};
