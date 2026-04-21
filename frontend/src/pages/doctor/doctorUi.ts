import type { RiskLevel } from '../../services/doctorPortalService';

export function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function formatTime(value?: string): string {
  if (!value) return '-';

  const parsed = new Date(`1970-01-01T${value}`);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(parsed);
  }

  const directParsed = new Date(value);
  if (!Number.isNaN(directParsed.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(directParsed);
  }

  return value;
}

export function greetingByTime(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function riskLabel(risk: RiskLevel): string {
  if (risk === 'high') return 'HIGH';
  if (risk === 'medium') return 'MEDIUM';
  return 'NORMAL';
}

export function riskClass(risk: RiskLevel): string {
  if (risk === 'high') return 'is-risk-high';
  if (risk === 'medium') return 'is-risk-medium';
  return 'is-risk-normal';
}

export function formatBloodPressure(value?: { systolic?: number; diastolic?: number }): string {
  if (!value?.systolic || !value?.diastolic) return '-';
  return `${value.systolic}/${value.diastolic}`;
}

export function isTodayDate(dateString?: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (!Number.isNaN(date.getTime())) {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const today = new Date();
  const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateString.startsWith(fallback);
}

export function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
