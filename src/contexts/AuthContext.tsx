import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/api';
import { asyncStorage, secureStorage } from '../services/storage';

interface AdminUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions?: string[];
  adminLabel?: string | null;
}

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<LoginResult>;
  verify2fa: (challengeToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (perms: string | string[]) => boolean;
}

export type LoginResult =
  | { kind: 'success' }
  | { kind: '2fa'; challengeToken: string }
  | { kind: '2fa-enroll'; enrollToken: string };

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await secureStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }
        const me = await authService.getCurrentUser();
        if (me?.role === 'SUPER_ADMIN' || me?.role === 'ADMIN') {
          setUser(me);
        } else {
          await secureStorage.multiRemove(['accessToken', 'refreshToken']);
        }
      } catch {
        await secureStorage.multiRemove(['accessToken', 'refreshToken']);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(
    login: string,
    password: string,
  ): Promise<LoginResult> {
    const res = await authService.login({ login, password });

    // 2FA requise → on retourne le challenge, le front affiche le code input
    if (res?.requires2fa) {
      if (res.requiresEnrollment) {
        return { kind: '2fa-enroll', enrollToken: res.enrollToken };
      }
      return { kind: '2fa', challengeToken: res.challengeToken };
    }

    // Pas de 2FA → session directe
    if (!res?.accessToken || !res?.refreshToken) {
      throw new Error('Réponse de connexion invalide');
    }
    if (res.user?.role !== 'SUPER_ADMIN' && res.user?.role !== 'ADMIN') {
      throw new Error('Accès réservé aux administrateurs');
    }
    await secureStorage.setItem('accessToken', res.accessToken);
    await secureStorage.setItem('refreshToken', res.refreshToken);
    await asyncStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
    return { kind: 'success' };
  }

  async function verify2fa(challengeToken: string, code: string) {
    const res = await authService.verify2fa({ challengeToken, code });
    if (!res?.accessToken || !res?.refreshToken) {
      throw new Error('Réponse 2FA invalide');
    }
    if (res.user?.role !== 'SUPER_ADMIN' && res.user?.role !== 'ADMIN') {
      throw new Error('Accès réservé aux administrateurs');
    }
    await secureStorage.setItem('accessToken', res.accessToken);
    await secureStorage.setItem('refreshToken', res.refreshToken);
    await asyncStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  }

  async function logout() {
    try {
      const rt = await secureStorage.getItem('refreshToken');
      if (rt) await authService.logout(rt);
    } catch {
      // ignore
    } finally {
      await secureStorage.multiRemove(['accessToken', 'refreshToken']);
      await asyncStorage.removeItem('user');
      setUser(null);
    }
  }

  function can(perms: string | string[]): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const owned = new Set(user.permissions ?? []);
    const needed = Array.isArray(perms) ? perms : [perms];
    if (needed.length === 0) return true;
    return needed.some((p) => owned.has(p));
  }

  return (
    <Ctx.Provider value={{ user, loading, login, verify2fa, logout, can }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
