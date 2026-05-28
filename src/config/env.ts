const DEFAULT_API_URL = 'http://localhost:3000';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL;

export const REQUEST_TIMEOUT_MS = 30000;
