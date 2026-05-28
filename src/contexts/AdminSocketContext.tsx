import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { secureStorage } from '../services/storage';
import { useAuth } from './AuthContext';

interface PendingCounts {
  kyc: number;
  withdrawals: number;
  refunds: number;
  merchants: number;
  reclamations: number;
}

interface AuditEvent {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

interface TxEvent {
  id: string;
  type: string;
  montant: string;
  devise: string;
  statut: string;
  date: string;
  reference: string;
}

interface AlertEvent {
  level: 'info' | 'warning' | 'danger';
  message: string;
  at: string;
}

interface Ctx {
  connected: boolean;
  pending: PendingCounts | null;
  lastAudit: AuditEvent | null;
  lastTx: TxEvent | null;
  lastAlert: AlertEvent | null;
}

const SocketCtx = createContext<Ctx>({
  connected: false,
  pending: null,
  lastAudit: null,
  lastTx: null,
  lastAlert: null,
});

export function AdminSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState<PendingCounts | null>(null);
  const [lastAudit, setLastAudit] = useState<AuditEvent | null>(null);
  const [lastTx, setLastTx] = useState<TxEvent | null>(null);
  const [lastAlert, setLastAlert] = useState<AlertEvent | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const token = await secureStorage.getItem('accessToken');
      if (!token || cancelled) return;

      const socket = io(`${API_BASE_URL}/super-admin`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', () => setConnected(false));
      socket.on('admin:pending', (data: PendingCounts) => setPending(data));
      socket.on('admin:audit', (data: AuditEvent) => setLastAudit(data));
      socket.on('admin:tx', (data: TxEvent) => setLastTx(data));
      socket.on('admin:alert', (data: AlertEvent) => setLastAlert(data));

      socketRef.current = socket;
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketCtx.Provider
      value={{ connected, pending, lastAudit, lastTx, lastAlert }}
    >
      {children}
    </SocketCtx.Provider>
  );
}

export function useAdminSocket() {
  return useContext(SocketCtx);
}
