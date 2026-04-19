import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { sessionStore } from '../../services/sessionStore';
import {
  getCurrentUser,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type PortalNotification
} from '../../services/patientPortalService';
import { connectPatientRealtime } from '../../services/patientRealtime';
import { formatDateTime, greetingByTime } from './patientUi';

type NavItem = {
  label: string;
  path: string;
  badgeKey?: 'messages' | 'notifications';
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTE_PATHS.patient.dashboard },
  { label: 'My Vitals', path: ROUTE_PATHS.patient.vitals },
  { label: 'Health Trends', path: ROUTE_PATHS.patient.trends },
  { label: 'My Doctors', path: ROUTE_PATHS.patient.doctors },
  { label: 'Appointments', path: ROUTE_PATHS.patient.appointments },
  { label: 'Prescriptions', path: ROUTE_PATHS.patient.prescriptions },
  { label: 'Messages', path: ROUTE_PATHS.patient.messages, badgeKey: 'messages' },
  { label: 'Notifications', path: ROUTE_PATHS.patient.notifications, badgeKey: 'notifications' }
];

export default function PatientLayout() {
  const location = useLocation();
  const [fullName, setFullName] = useState(sessionStore.getFullName() || 'Patient User');
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHeaderState() {
      try {
        const [user, notificationResult] = await Promise.all([
          getCurrentUser(),
          getMyNotifications(10)
        ]);

        if (!isMounted) return;

        setFullName(user.fullName || 'Patient User');
        sessionStore.setFullName(user.fullName || 'Patient User');
        sessionStore.setUserId(user.id);

        setNotifications(notificationResult.notifications);
        setUnreadCount(notificationResult.unreadCount);
      } catch {
        if (!isMounted) return;
        setNotifications([]);
      }
    }

    loadHeaderState();

    const accessToken = sessionStore.getAccessToken();
    if (!accessToken) {
      return () => {
        isMounted = false;
      };
    }

    const socket = connectPatientRealtime(accessToken);

    const onNotificationNew = (payload: {
      _id?: string;
      type?: string;
      title?: string;
      body?: string;
      isRead?: boolean;
      createdAt?: string;
    }) => {
      if (!payload?._id) return;
      const next: PortalNotification = {
        id: payload._id,
        type: payload.type || 'system',
        title: payload.title || 'Notification',
        body: payload.body,
        isRead: Boolean(payload.isRead),
        createdAt: payload.createdAt
      };

      setNotifications((previous) => {
        const filtered = previous.filter((item) => item.id !== next.id);
        return [next, ...filtered].slice(0, 20);
      });
    };

    const onUnreadCount = (payload: { unreadCount?: number }) => {
      setUnreadCount(payload?.unreadCount || 0);
    };

    const onNotificationRead = (payload: { notificationId?: string }) => {
      if (!payload?.notificationId) return;
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === payload.notificationId
            ? {
                ...item,
                isRead: true
              }
            : item
        )
      );
    };

    const onNotificationReadAll = () => {
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    };

    const onChatMessage = (payload: { message?: { senderId?: string } }) => {
      const currentUserId = sessionStore.getUserId();
      const senderId = payload?.message?.senderId;
      const onMessagesPage = location.pathname === ROUTE_PATHS.patient.messages;

      if (!senderId || senderId === currentUserId || onMessagesPage) {
        return;
      }

      setMessageCount((previous) => previous + 1);
    };

    socket.on('notification:new', onNotificationNew);
    socket.on('notification:unread_count', onUnreadCount);
    socket.on('notification:read', onNotificationRead);
    socket.on('notification:read_all', onNotificationReadAll);
    socket.on('chat:message:new', onChatMessage);
    socket.emit('notification:list', { limit: 10 });

    return () => {
      isMounted = false;
      socket.off('notification:new', onNotificationNew);
      socket.off('notification:unread_count', onUnreadCount);
      socket.off('notification:read', onNotificationRead);
      socket.off('notification:read_all', onNotificationReadAll);
      socket.off('chat:message:new', onChatMessage);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === ROUTE_PATHS.patient.messages) {
      setMessageCount(0);
    }
  }, [location.pathname]);

  const currentSection = useMemo(() => {
    const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
    return match?.label || 'Dashboard';
  }, [location.pathname]);

  async function handleNotificationRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((previous) =>
        previous.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    } catch {
      // Keep existing state if request fails.
    }
  }

  async function handleReadAllNotifications() {
    try {
      await markAllNotificationsRead();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Keep existing state if request fails.
    }
  }

  return (
    <div className={`patient-shell ${isSidebarExpanded ? '' : 'is-sidebar-collapsed'}`}>
      <aside className="patient-sidebar">
        <div className="patient-sidebar-top">
          <button
            type="button"
            className="patient-sidebar-toggle"
            onClick={() => setIsSidebarExpanded((previous) => !previous)}
          >
            {isSidebarExpanded ? 'Collapse' : 'Expand'}
          </button>
          <p className="patient-sidebar-brand">HM Pro</p>
        </div>

        <nav className="patient-sidebar-nav" aria-label="Patient dashboard navigation">
          {NAV_ITEMS.map((item) => {
            const badgeCount =
              item.badgeKey === 'messages'
                ? messageCount
                : item.badgeKey === 'notifications'
                  ? unreadCount
                  : 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `patient-sidebar-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span>{item.label}</span>
                {badgeCount > 0 ? <span className="patient-badge">{badgeCount}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="patient-sidebar-footer">
          <p className="patient-user-name">{fullName}</p>
          <NavLink to={ROUTE_PATHS.patient.profile} className="patient-profile-link">
            View Profile
          </NavLink>
        </div>
      </aside>

      <div className="patient-main">
        <header className="patient-topbar">
          <div>
            <p className="patient-topbar-breadcrumb">Patient / {currentSection}</p>
            <h1>{greetingByTime()}, {fullName.split(' ')[0]}</h1>
          </div>

          <div className="patient-topbar-actions">
            <button
              type="button"
              className="patient-notification-button"
              onClick={() => setIsNotificationPanelOpen((previous) => !previous)}
            >
              Notifications
              {unreadCount > 0 ? <span className="patient-badge">{unreadCount}</span> : null}
            </button>
          </div>
        </header>

        {isNotificationPanelOpen ? (
          <section className="patient-notification-panel">
            <div className="patient-notification-head">
              <h2>Notifications</h2>
              <button type="button" onClick={handleReadAllNotifications}>
                Mark all read
              </button>
            </div>
            <ul className="patient-notification-list">
              {notifications.length === 0 ? (
                <li className="patient-notification-item">
                  <p>No notifications yet.</p>
                </li>
              ) : (
                notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`patient-notification-item ${notification.isRead ? '' : 'is-unread'}`}
                  >
                    <div>
                      <h3>{notification.title}</h3>
                      {notification.body ? <p>{notification.body}</p> : null}
                      <small>{formatDateTime(notification.createdAt)}</small>
                    </div>
                    {!notification.isRead ? (
                      <button
                        type="button"
                        className="patient-link-button"
                        onClick={() => handleNotificationRead(notification.id)}
                      >
                        Mark read
                      </button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}

        <main className="patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
