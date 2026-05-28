import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/env';
import { asyncStorage, getOrCreateDeviceId, secureStorage } from './storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const [token, deviceId] = await Promise.all([
    secureStorage.getItem('accessToken'),
    getOrCreateDeviceId(),
  ]);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-device-id'] = deviceId;
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshToken = await secureStorage.getItem('refreshToken');
            const deviceId = await getOrCreateDeviceId();
            const response = await axios.post(
              `${API_BASE_URL}/auth/admin/refresh`,
              { refreshToken },
              { headers: { 'x-device-id': deviceId } },
            );
            if (response.data?.accessToken && response.data?.refreshToken) {
              await secureStorage.setItem('accessToken', response.data.accessToken);
              await secureStorage.setItem('refreshToken', response.data.refreshToken);
              return response.data.accessToken as string;
            }
            throw new Error('Refresh failed');
          })();
        }
        const newAccessToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        refreshPromise = null;
        await secureStorage.multiRemove(['accessToken', 'refreshToken']);
        await asyncStorage.removeItem('user');
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authService = {
  login: (data: { login: string; password: string }) =>
    api.post('/auth/admin/login', data).then((r) => r.data),
  verify2fa: (data: { challengeToken: string; code: string }) =>
    api.post('/auth/admin/login/verify-2fa', data).then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/admin/logout', { refreshToken }).then((r) => r.data),
  getCurrentUser: () => api.get('/auth/admin/me').then((r) => r.data),

  // 2FA self-service
  status2fa: () => api.get('/auth/admin/2fa/status').then((r) => r.data),
  setup2fa: () => api.post('/auth/admin/2fa/setup').then((r) => r.data),
  confirm2fa: (code: string) =>
    api.post('/auth/admin/2fa/confirm', { code }).then((r) => r.data),
  disable2fa: (password: string, code: string) =>
    api
      .post('/auth/admin/2fa/disable', { password, code })
      .then((r) => r.data),
  regenerateBackupCodes: (code: string) =>
    api
      .post('/auth/admin/2fa/backup-codes/regenerate', { code })
      .then((r) => r.data),
};

export default api;
