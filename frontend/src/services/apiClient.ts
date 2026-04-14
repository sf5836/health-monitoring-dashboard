export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const ACCESS_TOKEN_KEY = 'hm.accessToken';

export class ApiError extends Error {
  status: number;

  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    ...headers
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getStoredAccessToken();
    if (!token) {
      throw new ApiError('Please login first.', 401);
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const raw = await parseResponseBody(response);

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    if (typeof raw === 'object' && raw !== null) {
      const payload = raw as { message?: string };
      throw new ApiError(payload.message || fallbackMessage, response.status, raw);
    }
    throw new ApiError(typeof raw === 'string' && raw ? raw : fallbackMessage, response.status, raw);
  }

  if (typeof raw === 'object' && raw !== null && 'data' in (raw as Record<string, unknown>)) {
    return (raw as { data: T }).data;
  }

  return raw as T;
}
