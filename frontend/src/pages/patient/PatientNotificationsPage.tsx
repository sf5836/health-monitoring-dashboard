import { useEffect, useState } from 'react';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type PortalNotification
} from '../../services/patientPortalService';
import { formatDateTime } from './patientUi';

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const result = await getMyNotifications(80);
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

  async function handleMarkRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((previous) =>
        previous.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    } catch {
      setError('Unable to update notification state.');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      setError('');
    } catch {
      setError('Unable to mark all notifications as read.');
    }
  }

  return (
    <section className="patient-page">
      <header className="patient-page-head">
        <div>
          <h2>Notifications</h2>
          <p>Unread: {unreadCount}</p>
        </div>
        <button type="button" className="patient-secondary-button" onClick={handleMarkAllRead}>
          Mark all as read
        </button>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <article className="patient-card">
        {loading ? (
          <p className="patient-page-status">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="patient-empty-state">No notifications yet.</p>
        ) : (
          <ul className="patient-list">
            {notifications.map((item) => (
              <li key={item.id} className={`patient-list-item ${item.isRead ? '' : 'is-unread'}`}>
                <div>
                  <p>{item.title}</p>
                  {item.body ? <small>{item.body}</small> : null}
                  <small>{formatDateTime(item.createdAt)}</small>
                </div>
                {!item.isRead ? (
                  <button
                    type="button"
                    className="patient-link-button"
                    onClick={() => handleMarkRead(item.id)}
                  >
                    Mark read
                  </button>
                ) : (
                  <span className="patient-risk-pill is-risk-normal">Read</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
