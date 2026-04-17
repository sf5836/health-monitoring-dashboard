import { APP_ENV } from '../config/env';
import { sessionStore } from './sessionStore';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStore.getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(APP_ENV.apiBaseUrl + endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'API request failed');
  }

  if (response.status === 204) return {} as T;
  return response.json();
}