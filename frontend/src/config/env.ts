const DEFAULT_API_BASE_URL = '/api';

export const APP_ENV = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
} as const;
