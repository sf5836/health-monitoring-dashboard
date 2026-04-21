import { ROUTE_PATHS } from '../routes/routePaths';
import { APP_ENV } from '../config/env';
import { sessionStore } from './sessionStore';

export type SessionRole = 'patient' | 'doctor' | 'admin';

function isSessionRole(value: string | null): value is SessionRole {
  return value === 'patient' || value === 'doctor' || value === 'admin';
}

export function getSessionRole(): SessionRole | null {
  const role = sessionStore.getRole();
  return isSessionRole(role) ? role : null;
}

export function hasSessionTokens(): boolean {
  return Boolean(sessionStore.getAccessToken() && sessionStore.getRefreshToken());
}

export function isSessionActive(): boolean {
  return hasSessionTokens() && Boolean(getSessionRole());
}

export function getDashboardPathForRole(role: SessionRole): string {
  if (role === 'patient') return ROUTE_PATHS.patient.dashboard;
  if (role === 'doctor') return ROUTE_PATHS.doctor.dashboard;
  return ROUTE_PATHS.admin.dashboard;
}

export function getSessionDashboardRoute(): string | null {
  const role = getSessionRole();
  if (!role) return null;
  return getDashboardPathForRole(role);
}

export async function expireCurrentSession(): Promise<void> {
  const refreshToken = sessionStore.getRefreshToken();
  const accessToken = sessionStore.getAccessToken();

  if (refreshToken) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      await fetch(APP_ENV.apiBaseUrl + '/auth/logout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken })
      });
    } catch {
      // Session is still cleared locally even if logout request fails.
    }
  }

  sessionStore.clear();
}
