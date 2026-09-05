import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { sessionStore } from '../../services/sessionStore';
import { expireCurrentSession } from '../../services/authSession';
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
  badgeKey?: 'messages';
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTE_PATHS.patient.dashboard },
  { label: 'My Vitals', path: ROUTE_PATHS.patient.vitals },
  { label: 'Health Trends', path: ROUTE_PATHS.patient.trends },
  { label: 'My Doctors', path: ROUTE_PATHS.patient.doctors },
  { label: 'Appointments', path: ROUTE_PATHS.patient.appointments },
  { label: 'Prescriptions', path: ROUTE_PATHS.patient.prescriptions },
  { label: 'Messages', path: ROUTE_PATHS.patient.messages, badgeKey: 'messages' }
];

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(sessionStore.getFullName() || 'Patient User');
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleSidebarToggle() {
    setIsMobileSidebarOpen((previous) => !previous);
  }

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
      setUnreadCount((previous) => Math.max(previous - 1, 0));
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

    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');

    const handleViewportChange = () => {
      if (!mediaQuery.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleViewportChange);

    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange);
    };
  }, []);

  const currentSection = useMemo(() => {
    const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
    return match?.label || 'Dashboard';
  }, [location.pathname]);

  const notificationButtonLabel = isNotificationPanelOpen ? 'Close notifications' : 'Open notifications';

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

  async function handleLogout() {
    await expireCurrentSession();
    navigate(ROUTE_PATHS.public.home, { replace: true });
  }

  return (
    <div className={`patient-shell ${isMobileSidebarOpen ? 'is-mobile-sidebar-open' : ''}`}>
      <aside className="patient-sidebar">
        <div className="patient-sidebar-top">
          <p className="patient-sidebar-brand">HM Pro</p>
        </div>

        <nav className="patient-sidebar-nav" aria-label="Patient dashboard navigation">
          {NAV_ITEMS.map((item) => {
            const badgeCount =
              item.badgeKey === 'messages'
                ? messageCount
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

      <button
        type="button"
        className="patient-sidebar-overlay"
        aria-label="Close sidebar"
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <div className="patient-main">
        <header className="patient-topbar">
          <div>
            <p className="patient-topbar-breadcrumb">Patient / {currentSection}</p>
            <h1>{greetingByTime()}, {fullName.split(' ')[0]}</h1>
          </div>

          <div className="patient-topbar-actions">
            <button
              type="button"
              className="patient-secondary-button"
              onClick={() => navigate(ROUTE_PATHS.public.home)}
            >
              Back to Website
            </button>
            <button type="button" className="patient-secondary-button" onClick={handleLogout}>
              Logout
            </button>
            <button
              type="button"
              className="patient-sidebar-mobile-toggle"
              aria-label="Toggle sidebar navigation"
              onClick={handleSidebarToggle}
            >
              {isMobileSidebarOpen ? 'Close Menu' : 'Menu'}
            </button>
            <div className="patient-notification-wrap">
              <button
                type="button"
                className="patient-notification-button"
                aria-label={notificationButtonLabel}
                aria-expanded={isNotificationPanelOpen}
                aria-controls="patient-notification-dropdown"
                onClick={() => setIsNotificationPanelOpen((previous) => !previous)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="patient-notification-icon">
                  <path
                    d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm8-6.5c-1.1-1.1-2-2.1-2-5V9a6 6 0 1 0-12 0v1.5c0 2.9-.9 3.9-2 5-.4.4-.5 1-.2 1.5.2.5.7.8 1.3.8h15.8c.6 0 1.1-.3 1.3-.8.3-.5.2-1.1-.2-1.5Z"
                    fill="currentColor"
                  />
                </svg>
                {unreadCount > 0 ? <span className="patient-badge">{unreadCount}</span> : null}
              </button>

              {isNotificationPanelOpen ? (
                <section className="patient-notification-panel" id="patient-notification-dropdown">
                  <div className="patient-notification-head">
                    <h2>Notifications</h2>
                    <button className="patient-mark-all-button" type="button" onClick={handleReadAllNotifications} aria-label="Mark all notifications as read" title="Mark all notifications as read">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2.5 12.5 3.2 3.2 6.1-6.2" /><path d="m9.5 12.5 3.2 3.2 8.8-8.9" /></svg>
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
                              className="patient-link-button patient-mark-read-button"
                              onClick={() => handleNotificationRead(notification.id)}
                              aria-label="Mark notification as read"
                              title="Mark notification as read"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2.5 12.5 3.2 3.2 6.1-6.2" /><path d="m9.5 12.5 3.2 3.2 8.8-8.9" /></svg>
                            </button>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                </section>
              ) : null}
            </div>
          </div>
        </header>

        <main className="patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
