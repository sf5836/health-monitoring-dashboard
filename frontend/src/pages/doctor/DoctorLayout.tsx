import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import {
  getDoctorInboxOverview,
  getDoctorProfile,
  type DoctorNotification,
  type DoctorProfile
} from '../../services/doctorPortalService';
import { markAllNotificationsRead, markNotificationRead } from '../../services/patientPortalService';
import { connectPatientRealtime } from '../../services/patientRealtime';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { sessionStore } from '../../services/sessionStore';
import { expireCurrentSession } from '../../services/authSession';

type DoctorNavItem = {
  label: string;
  icon: string;
  path: string;
  badgeKey?: 'messages' | 'notifications';
};

const NAV_ITEMS: DoctorNavItem[] = [
  { label: 'Dashboard', icon: '📊', path: ROUTE_PATHS.doctor.dashboard },
  { label: 'My Patients', icon: '👥', path: ROUTE_PATHS.doctor.patients },
  { label: 'Prescriptions', icon: '💊', path: ROUTE_PATHS.doctor.prescriptions },
  { label: 'Appointments', icon: '📅', path: ROUTE_PATHS.doctor.appointments },
  { label: 'My Blogs', icon: '📝', path: ROUTE_PATHS.doctor.blogs },
  { label: 'Messages', icon: '💬', path: ROUTE_PATHS.doctor.messages, badgeKey: 'messages' },
  { label: 'Profile', icon: '👤', path: ROUTE_PATHS.doctor.profile },
];

export default function DoctorLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLayoutState() {
      try {
        const [doctorProfile, inbox] = await Promise.all([getDoctorProfile(), getDoctorInboxOverview(50)]);

        if (cancelled) return;

        setProfile(doctorProfile);
        sessionStore.setFullName(doctorProfile.user.fullName);
        if (doctorProfile.user.id) {
          sessionStore.setUserId(doctorProfile.user.id);
        }

        setNotifications(inbox.notifications);
        setUnreadCount(inbox.unreadCount);
        setMessageCount(inbox.unreadChatCount);
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 403) {
          navigate(ROUTE_PATHS.doctor.pendingApproval, { replace: true });
          return;
        }

        setProfile(null);
      }
    }

    loadLayoutState();

    const token = sessionStore.getAccessToken();
    if (!token) {
      return () => {
        cancelled = true;
      };
    }

    const socket = connectPatientRealtime(token);

    const onNotificationNew = (payload: {
      _id?: string;
      type?: string;
      title?: string;
      body?: string;
      isRead?: boolean;
      createdAt?: string;
    }) => {
      if (!payload._id) return;

      const nextNotification: DoctorNotification = {
        id: payload._id,
        type: payload.type || 'system',
        title: payload.title || 'Notification',
        body: payload.body,
        isRead: Boolean(payload.isRead),
        createdAt: payload.createdAt
      };

      setNotifications((previous) => {
        const withoutCurrent = previous.filter((item) => item.id !== nextNotification.id);
        return [nextNotification, ...withoutCurrent].slice(0, 20);
      });

      if (!nextNotification.isRead && nextNotification.type === 'chat') {
        setMessageCount((previous) => previous + 1);
      }
    };

    const onUnreadCount = (payload: { unreadCount?: number }) => {
      setUnreadCount(payload.unreadCount || 0);
    };

    const onReadSingle = (payload: { notificationId?: string }) => {
      if (!payload.notificationId) return;

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

    const onReadAll = () => {
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      setMessageCount(0);
    };

    const onChatMessage = (payload: { message?: { senderId?: string } }) => {
      const currentUserId = sessionStore.getUserId();
      const senderId = payload?.message?.senderId;
      const onMessagesRoute = location.pathname.startsWith(ROUTE_PATHS.doctor.messages);

      if (!senderId || senderId === currentUserId || onMessagesRoute) {
        return;
      }

      setMessageCount((previous) => previous + 1);
    };

    socket.on('notification:new', onNotificationNew);
    socket.on('notification:unread_count', onUnreadCount);
    socket.on('notification:read', onReadSingle);
    socket.on('notification:read_all', onReadAll);
    socket.on('chat:message:new', onChatMessage);
    socket.emit('notification:list', { limit: 20 });

    return () => {
      cancelled = true;
      socket.off('notification:new', onNotificationNew);
      socket.off('notification:unread_count', onUnreadCount);
      socket.off('notification:read', onReadSingle);
      socket.off('notification:read_all', onReadAll);
      socket.off('chat:message:new', onChatMessage);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname.startsWith(ROUTE_PATHS.doctor.messages)) {
      setMessageCount(0);
    }

    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');

    const onChange = () => {
      if (!mediaQuery.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', onChange);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  const currentSection = useMemo(() => {
    const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
    return match?.label || 'Dashboard';
  }, [location.pathname]);

  async function onMarkNotificationRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true
              }
            : item
        )
      );
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    } catch {
      // Keep local state unchanged on request failure.
    }
  }

  async function onMarkAllNotificationsRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      setMessageCount(0);
    } catch {
      // Keep local state unchanged on request failure.
    }
  }

  async function onLogout() {
    await expireCurrentSession();
    navigate(ROUTE_PATHS.public.home, { replace: true });
  }

  const doctorName = profile?.user.fullName || sessionStore.getFullName() || 'Doctor';
  const specialization = profile?.specialization || 'Specialist';

  return (
    <div className={`doctor-shell ${isMobileSidebarOpen ? 'is-mobile-sidebar-open' : ''}`}>
      <aside className="doctor-sidebar">
        <div className="doctor-sidebar-top">
          <p className="doctor-sidebar-brand">HM Pro</p>
          <p className="doctor-sidebar-brand-subtitle">Doctor Console</p>
        </div>

        <nav className="doctor-sidebar-nav" aria-label="Doctor dashboard navigation">
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
                className={({ isActive }) => `doctor-sidebar-link ${isActive ? 'is-active' : ''}`}
              >
                <span className="doctor-sidebar-link-label">
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </span>
                {badgeCount > 0 ? <span className="doctor-badge">{badgeCount}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="doctor-sidebar-footer">
          <p className="doctor-user-name">{doctorName}</p>
          <p className="doctor-user-specialization">{specialization}</p>
        </div>
      </aside>

      <button
        type="button"
        className="doctor-sidebar-overlay"
        aria-label="Close sidebar"
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <div className="doctor-main">
        <header className="doctor-topbar">
          <div>
            <p className="doctor-topbar-breadcrumb">Doctor / {currentSection}</p>
            <h1>{doctorName}</h1>
          </div>

          <div className="doctor-topbar-actions">
            <span className="doctor-specialization-chip">{specialization}</span>
            <button
              type="button"
              className="doctor-secondary-button compact"
              onClick={() => navigate(ROUTE_PATHS.public.home)}
            >
              Back to Website
            </button>
            <button type="button" className="doctor-secondary-button compact" onClick={onLogout}>
              Logout
            </button>
            <button
              type="button"
              className="doctor-sidebar-mobile-toggle"
              aria-label="Toggle sidebar navigation"
              onClick={() => setIsMobileSidebarOpen((previous) => !previous)}
            >
              {isMobileSidebarOpen ? 'Close Menu' : 'Menu'}
            </button>
            <button
              type="button"
              className="doctor-notification-button"
              onClick={() => setIsNotificationPanelOpen((previous) => !previous)}
            >
              Notifications
              {unreadCount > 0 ? <span className="doctor-badge">{unreadCount}</span> : null}
            </button>
          </div>
        </header>

        {isNotificationPanelOpen ? (
          <section className="doctor-notification-panel">
            <div className="doctor-notification-head">
              <h2>Notifications</h2>
              <button type="button" onClick={onMarkAllNotificationsRead}>
                Mark all read
              </button>
            </div>
            <ul className="doctor-notification-list">
              {notifications.length === 0 ? (
                <li className="doctor-notification-item">
                  <p>No notifications yet.</p>
                </li>
              ) : (
                notifications.map((item) => (
                  <li key={item.id} className={`doctor-notification-item ${item.isRead ? '' : 'is-unread'}`}>
                    <div>
                      <h3>{item.title}</h3>
                      {item.body ? <p>{item.body}</p> : null}
                    </div>
                    {!item.isRead ? (
                      <button
                        type="button"
                        className="doctor-link-button"
                        onClick={() => onMarkNotificationRead(item.id)}
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

        <main className="doctor-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
