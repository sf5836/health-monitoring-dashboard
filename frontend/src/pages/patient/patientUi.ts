import type { RiskLevel } from '../../services/patientPortalService';

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

export function toLocalDatetimeInput(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

export function fromLocalDatetimeInput(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function riskLabel(risk: RiskLevel): string {
  if (risk === 'high') return 'High';
  if (risk === 'medium') return 'Medium';
  return 'Normal';
}

export function riskClass(risk: RiskLevel): string {
  if (risk === 'high') return 'is-risk-high';
  if (risk === 'medium') return 'is-risk-medium';
  return 'is-risk-normal';
}

export function greetingByTime(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatBloodPressure(value?: { systolic?: number; diastolic?: number }): string {
  if (!value?.systolic || !value?.diastolic) return '-';
  return `${value.systolic} / ${value.diastolic}`;
}
