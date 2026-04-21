import { APP_ENV } from '../config/env';
import { sessionStore } from './sessionStore';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshInFlight: Promise<boolean> | null = null;

function isRefreshEligibleEndpoint(endpoint: string): boolean {
  return (
    endpoint !== '/auth/refresh' &&
    endpoint !== '/auth/login' &&
    endpoint !== '/auth/admin/login' &&
    endpoint !== '/auth/admin-login'
  );
}

async function parseResponse(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

function buildHeaders(options: RequestInit): Headers {
  const token = sessionStore.getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

async function refreshAccessToken(): Promise<boolean> {
  const existingRefreshToken = sessionStore.getRefreshToken();
  if (!existingRefreshToken) {
    return false;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(APP_ENV.apiBaseUrl + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: existingRefreshToken })
      });

      if (!response.ok) {
        return false;
      }

      const payload = (await parseResponse(response)) as {
        data?: { accessToken?: string; refreshToken?: string };
      };
      const nextAccessToken = payload.data?.accessToken;
      const nextRefreshToken = payload.data?.refreshToken;

      if (!nextAccessToken || !nextRefreshToken) {
        return false;
      }

      sessionStore.setTokens(nextAccessToken, nextRefreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  const refreshed = await refreshInFlight;
  if (!refreshed) {
    sessionStore.clear();
  }

  return refreshed;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response = await fetch(APP_ENV.apiBaseUrl + endpoint, {
    ...options,
    headers: buildHeaders(options)
  });

  if (
    response.status === 401 &&
    isRefreshEligibleEndpoint(endpoint) &&
    Boolean(sessionStore.getRefreshToken())
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(APP_ENV.apiBaseUrl + endpoint, {
        ...options,
        headers: buildHeaders(options)
      });
    }
  }

  if (!response.ok) {
    const errorData = (await parseResponse(response)) as { message?: string };
    throw new ApiError(response.status, errorData.message || 'API request failed');
  }

  if (response.status === 204) return {} as T;
  return (await parseResponse(response)) as T;
}