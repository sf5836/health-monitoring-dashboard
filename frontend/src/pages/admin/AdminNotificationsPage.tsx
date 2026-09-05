import { useEffect, useState } from 'react';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAdminNotificationsReadAll,
  type AdminNotification
} from '../../services/adminPortalService';
import { formatDateTime } from './adminUi';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const result = await getAdminNotifications(150);
        if (cancelled) return;
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load notifications.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  async function markOneRead(id: string) {
    try {
      await markAdminNotificationRead(id);
      setNotifications((previous) =>
        previous.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    } catch {
      setError('Unable to mark this notification as read.');
    }
  }

  async function markAllRead() {
    try {
      await markAdminNotificationsReadAll();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError('Unable to mark notifications as read.');
    }
  }

  if (loading) {
    return <p className="admin-page-status">Loading notifications...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>Notifications</h2>
          <p>{unreadCount} unread alerts</p>
        </div>
        <button type="button" className="admin-secondary-button" onClick={markAllRead}>
          Mark all as read
        </button>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <article className="admin-card">
        <ul className="admin-notification-list-full">
          {notifications.length === 0 ? (
            <li>
              <p className="admin-empty-state">No notifications available.</p>
            </li>
          ) : (
            notifications.map((item) => (
              <li key={item.id} className={item.isRead ? '' : 'unread'}>
                <div>
                  <p>{item.title}</p>
                  {item.body ? <small>{item.body}</small> : null}
                  <time>{formatDateTime(item.createdAt)}</time>
                </div>
                {!item.isRead ? (
                  <button type="button" className="admin-link-button admin-mark-read-button" onClick={() => markOneRead(item.id)} aria-label="Mark notification as read" title="Mark notification as read">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2.5 12.5 3.2 3.2 6.1-6.2" /><path d="m9.5 12.5 3.2 3.2 8.8-8.9" /></svg>
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
