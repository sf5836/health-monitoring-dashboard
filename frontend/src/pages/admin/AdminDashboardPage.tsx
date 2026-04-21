import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAdminAnalyticsGrowth,
  getAdminAppointments,
  getAdminDashboardMetrics,
  getAdminPendingBlogs,
  getAdminPendingDoctors,
  getAdminRecentActivity,
  type AdminBlog,
  type AdminDoctor,
  type AdminGrowthSeries,
  type AdminActivity,
  type AdminDashboardMetrics
} from '../../services/adminPortalService';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { formatDate, formatNumber, formatRelativeTime, isToday, sanitizeActionLabel } from './adminUi';

function linePath(values: number[], width: number, height: number, padding = 24): string {
  if (values.length <= 1) return `M ${padding} ${height - padding} L ${width - padding} ${height - padding}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<AdminDoctor[]>([]);
  const [pendingBlogs, setPendingBlogs] = useState<AdminBlog[]>([]);
  const [growth, setGrowth] = useState<AdminGrowthSeries | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [
          dashboardMetrics,
          pendingDoctorRows,
          pendingBlogRows,
          growthSeries,
          activityRows,
          appointments
        ] = await Promise.all([
          getAdminDashboardMetrics(),
          getAdminPendingDoctors(),
          getAdminPendingBlogs(),
          getAdminAnalyticsGrowth(30),
          getAdminRecentActivity(),
          getAdminAppointments()
        ]);

        if (cancelled) return;

        setMetrics(dashboardMetrics);
        setPendingDoctors(pendingDoctorRows.slice(0, 4));
        setPendingBlogs(pendingBlogRows.slice(0, 2));
        setGrowth(growthSeries);
        setRecentActivity(activityRows.slice(0, 10));

        const todayAppointments = appointments.filter((item) => {
          if (!item.date) return false;
          return isToday(new Date(`${item.date}T00:00:00`).toISOString());
        });
        setAppointmentsToday(todayAppointments.length);
        setLastUpdated(new Date());

        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load admin dashboard data right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    const intervalId = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshTick]);

  const cumulativeDoctors = useMemo(
    () => (growth?.cumulative || []).map((item) => item.doctors),
    [growth?.cumulative]
  );
  const cumulativePatients = useMemo(
    () => (growth?.cumulative || []).map((item) => item.patients),
    [growth?.cumulative]
  );

  const chartWidth = 940;
  const chartHeight = 320;

  const doctorPath = useMemo(
    () => linePath(cumulativeDoctors, chartWidth, chartHeight),
    [cumulativeDoctors]
  );
  const patientPath = useMemo(
    () => linePath(cumulativePatients, chartWidth, chartHeight),
    [cumulativePatients]
  );

  const operationalStatus = useMemo(() => {
    const pendingApprovals = metrics?.doctors.pending || 0;
    const highRisk = metrics?.clinical.highRiskVitals || 0;
    const pendingBlogs = metrics?.blogs.pending || 0;

    if (pendingApprovals >= 10 || highRisk >= 30) {
      return { label: 'Operational status: attention needed', tone: 'is-alert' as const };
    }

    if (pendingApprovals > 0 || highRisk > 0 || pendingBlogs > 0) {
      return { label: 'Operational status: monitoring queue', tone: 'is-watch' as const };
    }

    return { label: 'Operational status: stable', tone: 'is-stable' as const };
  }, [metrics]);

  if (loading) {
    return <p className="admin-page-status">Loading admin command center...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div className="admin-page-head-meta">
          <h2>Admin Command Center</h2>
          <small>Auto-refresh: every 30s{lastUpdated ? ` | Last update: ${lastUpdated.toLocaleTimeString()}` : ''}</small>
        </div>
        <div className="admin-inline-actions">
          <span className={`admin-operational-pill ${operationalStatus.tone}`}>{operationalStatus.label}</span>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => setRefreshTick((value) => value + 1)}
          >
            Refresh now
          </button>
        </div>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <section className="admin-kpi-grid">
        <article className="admin-kpi-card">
          <p>Total Users</p>
          <h3>{formatNumber((metrics?.doctors.total || 0) + (metrics?.patients.total || 0))}</h3>
          <small className="admin-kpi-caption">Platform accounts in active scope</small>
        </article>

        <article className="admin-kpi-card">
          <p>Active Doctors</p>
          <h3>{formatNumber(metrics?.doctors.approved || 0)}</h3>
          <small className="admin-kpi-caption">Approved and visible to patients</small>
        </article>

        <article className="admin-kpi-card">
          <p>Active Patients</p>
          <h3>{formatNumber(metrics?.patients.total || 0)}</h3>
          <small className="admin-kpi-caption">Users with patient role</small>
        </article>

        <article className="admin-kpi-card warning">
          <p>Pending Approvals</p>
          <h3>{formatNumber(metrics?.doctors.pending || 0)}</h3>
          <small className="admin-kpi-caption">Doctor onboarding review queue</small>
        </article>

        <article className="admin-kpi-card">
          <p>Blogs Published</p>
          <h3>{formatNumber(metrics?.blogs.published || 0)}</h3>
          <small className="admin-kpi-caption">Moderated public education content</small>
        </article>

        <article className="admin-kpi-card">
          <p>Appointments Today</p>
          <h3>{formatNumber(appointmentsToday)}</h3>
          <small className="admin-kpi-caption">Confirmed + pending sessions for today</small>
        </article>
      </section>

      <section className="admin-main-grid">
        <article className="admin-card admin-urgent-card">
          <div className="admin-card-head">
            <h3>Pending Doctor Approvals ({pendingDoctors.length})</h3>
            <button
              type="button"
              className="admin-link-button"
              onClick={() => navigate(ROUTE_PATHS.admin.doctors)}
            >
              View All Pending
            </button>
          </div>

          {pendingDoctors.length === 0 ? (
            <p className="admin-empty-state">No pending doctor approvals.</p>
          ) : (
            <ul className="admin-list">
              {pendingDoctors.map((doctor) => (
                <li key={doctor.id} className="admin-list-item">
                  <div>
                    <p>{doctor.fullName}</p>
                    <small>
                      {doctor.specialization || 'Specialist'} · Applied {formatRelativeTime(doctor.createdAt)}
                    </small>
                  </div>
                  <Link className="admin-primary-button compact" to={ROUTE_PATHS.admin.doctors}>
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-card admin-urgent-card">
          <div className="admin-card-head">
            <h3>Blogs Awaiting Review ({pendingBlogs.length})</h3>
            <button
              type="button"
              className="admin-link-button"
              onClick={() => navigate(ROUTE_PATHS.admin.blogs)}
            >
              View Queue
            </button>
          </div>

          {pendingBlogs.length === 0 ? (
            <p className="admin-empty-state">No pending blogs right now.</p>
          ) : (
            <ul className="admin-list">
              {pendingBlogs.map((blog) => (
                <li key={blog.id} className="admin-list-item">
                  <div>
                    <p>{blog.title}</p>
                    <small>
                      {blog.authorName} · {blog.category || 'General'} · {formatRelativeTime(blog.submittedAt)}
                    </small>
                  </div>
                  <Link className="admin-primary-button compact" to={ROUTE_PATHS.admin.blogs}>
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-chart-layout">
        <article className="admin-card admin-chart-card">
          <div className="admin-card-head">
            <h3>Platform Growth — Last 30 Days</h3>
          </div>

          {growth && growth.cumulative.length > 1 ? (
            <>
              <svg className="admin-growth-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#ffffff" />
                {[0, 1, 2, 3, 4].map((tick) => {
                  const y = 24 + tick * ((chartHeight - 48) / 4);
                  return <line key={tick} x1="24" y1={y} x2={chartWidth - 24} y2={y} className="admin-chart-grid" />;
                })}
                <path d={patientPath} className="admin-chart-line patients" />
                <path d={doctorPath} className="admin-chart-line doctors" />
              </svg>
              <div className="admin-chart-legend">
                <span className="patients">Patients</span>
                <span className="doctors">Doctors</span>
              </div>
            </>
          ) : (
            <p className="admin-empty-state">Not enough growth data yet.</p>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <h3>Recent Activity</h3>
          </div>

          {recentActivity.length === 0 ? (
            <p className="admin-empty-state">No recent activity available.</p>
          ) : (
            <ul className="admin-activity-list">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <div>
                    <p>{sanitizeActionLabel(item.action)}</p>
                    <small>
                      {item.actorName} · {item.entityType || 'system'}
                    </small>
                  </div>
                  <time>{formatRelativeTime(item.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h3>Queue Snapshot</h3>
          <small>{formatDate(new Date().toISOString())}</small>
        </div>
        <div className="admin-summary-grid">
          <p>Pending doctors: {metrics?.doctors.pending || 0}</p>
          <p>Suspended doctors: {metrics?.doctors.suspended || 0}</p>
          <p>Pending blogs: {metrics?.blogs.pending || 0}</p>
          <p>High-risk vitals: {metrics?.clinical.highRiskVitals || 0}</p>
        </div>
      </section>
    </section>
  );
}
