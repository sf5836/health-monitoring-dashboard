export function formatDate(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
}

export function formatDateTime(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(parsed);
}

export function formatRelativeTime(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return value;

  const diffMinutes = Math.floor((Date.now() - parsed) / (1000 * 60));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return formatDate(value);
}

export function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function statusClass(status?: string): string {
  if (status === 'approved' || status === 'published' || status === 'completed' || status === 'confirmed') {
    return 'is-success';
  }

  if (status === 'pending' || status === 'pending_review') return 'is-warning';
  if (status === 'rejected' || status === 'suspended' || status === 'cancelled' || status === 'unpublished') {
    return 'is-danger';
  }

  return 'is-neutral';
}

export function appointmentDateTime(date: string, time: string): number {
  const parsed = new Date(`${date}T${time}:00`).getTime();
  if (!Number.isNaN(parsed)) return parsed;
  return new Date(`${date} ${time}`).getTime();
}

export function isToday(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

export function sanitizeActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
