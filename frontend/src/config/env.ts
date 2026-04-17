const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

export const APP_ENV = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
} as const;
