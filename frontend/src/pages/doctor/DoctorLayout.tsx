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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

      setNotifications((previous) => {
        let shouldDecrement = false;
        const next = previous.map((item) => {
          if (item.id !== payload.notificationId) return item;
          if (!item.isRead && item.type === 'chat') {
            shouldDecrement = true;
          }
          return {
            ...item,
            isRead: true
          };
        });

        if (shouldDecrement) {
          setMessageCount((current) => Math.max(current - 1, 0));
        }

        return next;
      });
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

  const notificationButtonLabel = isNotificationPanelOpen ? 'Close notifications' : 'Open notifications';
  const profileButtonLabel = isProfileMenuOpen ? 'Close profile menu' : 'Open profile menu';

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
            <div className="doctor-notification-wrap">
              <button
                type="button"
                className="doctor-notification-button"
                aria-label={notificationButtonLabel}
                aria-expanded={isNotificationPanelOpen}
                aria-controls="doctor-notification-dropdown"
                onClick={() => {
                  setIsNotificationPanelOpen((previous) => !previous);
                  setIsProfileMenuOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="doctor-notification-icon">
                  <path
                    d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm8-6.5c-1.1-1.1-2-2.1-2-5V9a6 6 0 1 0-12 0v1.5c0 2.9-.9 3.9-2 5-.4.4-.5 1-.2 1.5.2.5.7.8 1.3.8h15.8c.6 0 1.1-.3 1.3-.8.3-.5.2-1.1-.2-1.5Z"
                    fill="currentColor"
                  />
                </svg>
                {unreadCount > 0 ? <span className="doctor-badge">{unreadCount}</span> : null}
              </button>

              {isNotificationPanelOpen ? (
                <section className="doctor-notification-panel" id="doctor-notification-dropdown">
                  <div className="doctor-notification-head">
                    <h2>Notifications</h2>
                    <button className="doctor-mark-all-button" type="button" onClick={onMarkAllNotificationsRead} aria-label="Mark all notifications as read" title="Mark all notifications as read">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2.5 12.5 3.2 3.2 6.1-6.2" /><path d="m9.5 12.5 3.2 3.2 8.8-8.9" /></svg>
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
                              className="doctor-link-button doctor-mark-read-button"
                              onClick={() => onMarkNotificationRead(item.id)}
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

            <div className="doctor-profile-menu-wrap">
              <button
                type="button"
                className="doctor-profile-menu-button"
                aria-label={profileButtonLabel}
                aria-expanded={isProfileMenuOpen}
                aria-controls="doctor-profile-dropdown"
                onClick={() => {
                  setIsProfileMenuOpen((previous) => !previous);
                  setIsNotificationPanelOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="doctor-profile-icon">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {isProfileMenuOpen ? (
                <div className="doctor-profile-menu" id="doctor-profile-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate(`${ROUTE_PATHS.doctor.profile}#photo`);
                    }}
                  >
                    Edit photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate(`${ROUTE_PATHS.doctor.profile}#edit`);
                    }}
                  >
                    Update profile
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="doctor-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
