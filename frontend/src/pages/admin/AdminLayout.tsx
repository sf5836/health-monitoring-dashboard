import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  getAdminDashboardMetrics,
  getAdminNotifications,
  markAdminNotificationsReadAll,
  type AdminDashboardMetrics,
  type AdminNotification
} from '../../services/adminPortalService';
import { connectPatientRealtime } from '../../services/patientRealtime';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { expireCurrentSession } from '../../services/authSession';
import { sessionStore } from '../../services/sessionStore';
import { formatDateTime, initials } from './adminUi';

type NavItem = {
  path: string;
  label: string;
  icon: string;
  section: 'OVERVIEW' | 'MANAGEMENT' | 'ANALYTICS' | 'SYSTEM';
  badge?: 'pendingDoctors' | 'pendingBlogs' | 'notifications';
};

const NAV_ITEMS: NavItem[] = [
  { path: ROUTE_PATHS.admin.dashboard, label: 'Dashboard', icon: '📊', section: 'OVERVIEW' },
  {
    path: ROUTE_PATHS.admin.doctors,
    label: 'Doctors',
    icon: '👨‍⚕️',
    section: 'MANAGEMENT',
    badge: 'pendingDoctors'
  },
  { path: ROUTE_PATHS.admin.patients, label: 'Patients', icon: '🧑', section: 'MANAGEMENT' },
  {
    path: ROUTE_PATHS.admin.blogs,
    label: 'Blogs',
    icon: '📝',
    section: 'MANAGEMENT',
    badge: 'pendingBlogs'
  },
  { path: ROUTE_PATHS.admin.appointments, label: 'Appointments', icon: '📅', section: 'MANAGEMENT' },
  { path: ROUTE_PATHS.admin.analytics, label: 'Analytics', icon: '📈', section: 'ANALYTICS' },
  {
    path: ROUTE_PATHS.admin.notifications,
    label: 'Notifications',
    icon: '🔔',
    section: 'ANALYTICS',
    badge: 'notifications'
  },
  { path: ROUTE_PATHS.admin.settings, label: 'Settings', icon: '⚙️', section: 'SYSTEM' }
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [lastLogin] = useState(new Date());

  useEffect(() => {
    let cancelled = false;

    async function loadLayoutData() {
      try {
        const [dashboard, inbox] = await Promise.all([
          getAdminDashboardMetrics(),
          getAdminNotifications(20)
        ]);

        if (cancelled) return;

        setMetrics(dashboard);
        setNotifications(inbox.notifications);
        setUnreadNotifications(inbox.unreadCount);
      } catch {
        if (cancelled) return;
      }
    }

    loadLayoutData();

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

      const mapped: AdminNotification = {
        id: payload._id,
        type: payload.type || 'system',
        title: payload.title || 'Notification',
        body: payload.body,
        isRead: Boolean(payload.isRead),
        createdAt: payload.createdAt
      };

      setNotifications((previous) => [mapped, ...previous.filter((item) => item.id !== mapped.id)].slice(0, 20));

      if (!mapped.isRead) {
        setUnreadNotifications((previous) => previous + 1);
      }
    };

    const onNotificationUnread = (payload: { unreadCount?: number }) => {
      setUnreadNotifications(payload.unreadCount || 0);
    };

    socket.on('notification:new', onNotificationNew);
    socket.on('notification:unread_count', onNotificationUnread);

    return () => {
      cancelled = true;
      socket.off('notification:new', onNotificationNew);
      socket.off('notification:unread_count', onNotificationUnread);
    };
  }, []);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname]);

  const sectionedItems = useMemo(() => {
    return {
      OVERVIEW: NAV_ITEMS.filter((item) => item.section === 'OVERVIEW'),
      MANAGEMENT: NAV_ITEMS.filter((item) => item.section === 'MANAGEMENT'),
      ANALYTICS: NAV_ITEMS.filter((item) => item.section === 'ANALYTICS'),
      SYSTEM: NAV_ITEMS.filter((item) => item.section === 'SYSTEM')
    };
  }, []);

  function badgeCount(item: NavItem): number {
    if (item.badge === 'pendingDoctors') {
      return metrics?.doctors.pending || 0;
    }

    if (item.badge === 'pendingBlogs') {
      return metrics?.blogs.pending || 0;
    }

    if (item.badge === 'notifications') {
      return unreadNotifications;
    }

    return 0;
  }

  async function markAllRead() {
    try {
      await markAdminNotificationsReadAll();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadNotifications(0);
    } catch {
      // Keep current state on failure.
    }
  }

  async function logout() {
    await expireCurrentSession();
    navigate(ROUTE_PATHS.auth.adminLogin, { replace: true });
  }

  const adminName = sessionStore.getFullName() || 'Super Admin';

  return (
    <div className={`admin-shell ${isMobileSidebarOpen ? 'is-mobile-sidebar-open' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <p className="admin-sidebar-eyebrow">Admin Portal</p>
          <div className="admin-sidebar-identity">
            <div className="admin-avatar" aria-hidden="true">
              {initials(adminName)}
            </div>
            <div>
              <p className="admin-name">{adminName}</p>
              <p className="admin-role-tag">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin portal navigation">
          {(['OVERVIEW', 'MANAGEMENT', 'ANALYTICS', 'SYSTEM'] as const).map((section) => (
            <section key={section} className="admin-nav-section">
              <p>{section}</p>
              {sectionedItems[section].map((item) => {
                const count = badgeCount(item);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="admin-nav-label">
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </span>
                    {count > 0 ? <span className="admin-nav-badge">{count}</span> : null}
                  </NavLink>
                );
              })}
              {section === 'SYSTEM' ? (
                <button type="button" className="admin-nav-link admin-logout-link" onClick={logout}>
                  <span className="admin-nav-label">
                    <span aria-hidden="true">🚪</span>
                    Logout
                  </span>
                </button>
              ) : null}
            </section>
          ))}
        </nav>
      </aside>

      <button
        type="button"
        className="admin-sidebar-overlay"
        aria-label="Close sidebar"
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Admin Dashboard</h1>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-mobile-menu-button"
              onClick={() => setIsMobileSidebarOpen((previous) => !previous)}
            >
              {isMobileSidebarOpen ? 'Close Menu' : 'Menu'}
            </button>
            <div className="admin-topbar-user">
              <div className="admin-avatar small" aria-hidden="true">
                {initials(adminName)}
              </div>
              <div>
                <p>{adminName}</p>
                <small>Last login: {formatDateTime(lastLogin.toISOString())}</small>
              </div>
            </div>
          </div>
        </header>

        {notifications.length > 0 ? (
          <section className="admin-notification-strip">
            <div>
              <p>Live updates</p>
              <small>{notifications[0].title}</small>
            </div>
            <button type="button" onClick={markAllRead}>
              Mark all read
            </button>
          </section>
        ) : null}

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
