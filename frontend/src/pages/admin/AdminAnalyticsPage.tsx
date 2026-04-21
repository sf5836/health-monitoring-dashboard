import { useEffect, useMemo, useState } from 'react';
import {
  getAdminAnalyticsBlogs,
  getAdminAnalyticsGrowth,
  getAdminAnalyticsOverview,
  getAdminAnalyticsPerformance,
  type AdminAnalyticsPerformance,
  type AdminBlogAnalytics,
  type AdminGrowthSeries,
  type AdminOverviewKpis
} from '../../services/adminPortalService';
import { formatDate, formatNumber } from './adminUi';

type RangeKey = '7' | '30' | '90' | '365';

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

function areaPath(values: number[], width: number, height: number, padding = 24): string {
  const line = linePath(values, width, height, padding);
  if (!line) return '';
  return `${line} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
}

function percentLabel(current: number, previous: number): string {
  if (previous <= 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function splitPeriods(values: number[]): { current: number; previous: number } {
  if (values.length === 0) return { current: 0, previous: 0 };
  const midpoint = Math.max(1, Math.floor(values.length / 2));
  const previous = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const current = values.slice(midpoint).reduce((sum, value) => sum + value, 0);
  return { current, previous };
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('30');
  const [overview, setOverview] = useState<AdminOverviewKpis | null>(null);
  const [growth, setGrowth] = useState<AdminGrowthSeries | null>(null);
  const [blogs, setBlogs] = useState<AdminBlogAnalytics | null>(null);
  const [performance, setPerformance] = useState<AdminAnalyticsPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const days = Number(range);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const [overviewData, growthData, blogData, performanceData] = await Promise.all([
          getAdminAnalyticsOverview(days),
          getAdminAnalyticsGrowth(days),
          getAdminAnalyticsBlogs(),
          getAdminAnalyticsPerformance()
        ]);

        if (cancelled) return;

        setOverview(overviewData);
        setGrowth(growthData);
        setBlogs(blogData);
        setPerformance(performanceData);
        setLastUpdated(new Date());
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load analytics at the moment.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    const intervalId = window.setInterval(() => {
      void loadAnalytics();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [days, refreshTick]);

  const width = 820;
  const height = 300;

  const patientDaily = useMemo(() => (growth?.patientsDaily || []).map((item) => item.count), [growth?.patientsDaily]);
  const doctorDaily = useMemo(() => (growth?.doctorsDaily || []).map((item) => item.count), [growth?.doctorsDaily]);
  const vitalsDaily = useMemo(() => (growth?.vitalsDaily || []).map((item) => item.count), [growth?.vitalsDaily]);

  const patientPath = useMemo(() => linePath(patientDaily, width, height), [patientDaily]);
  const doctorPath = useMemo(() => linePath(doctorDaily, width, height), [doctorDaily]);
  const vitalsLine = useMemo(() => linePath(vitalsDaily, width, height), [vitalsDaily]);
  const vitalsArea = useMemo(() => areaPath(vitalsDaily, width, height), [vitalsDaily]);

  const headlineCards = useMemo(() => {
    const vitalsSplit = splitPeriods(vitalsDaily);
    const patientsSplit = splitPeriods(patientDaily);
    const doctorsSplit = splitPeriods(doctorDaily);

    return [
      {
        label: 'New Patients',
        value: overview?.headlineKpis.newPatients || 0,
        change: percentLabel(patientsSplit.current, patientsSplit.previous)
      },
      {
        label: 'New Doctors',
        value: overview?.headlineKpis.newDoctors || 0,
        change: percentLabel(doctorsSplit.current, doctorsSplit.previous)
      },
      {
        label: 'Total Vitals Logged',
        value: overview?.headlineKpis.vitalsLogged || 0,
        change: percentLabel(vitalsSplit.current, vitalsSplit.previous)
      },
      {
        label: 'Appointments Completed',
        value: overview?.headlineKpis.appointmentsCompleted || 0,
        change: `${days}-day total`
      },
      {
        label: 'Blogs Published',
        value: overview?.headlineKpis.blogsPublished || 0,
        change: `${days}-day total`
      }
    ];
  }, [days, doctorDaily, overview?.headlineKpis, patientDaily, vitalsDaily]);

  const snapshotCards = useMemo(
    () => [
      { label: 'Total Users', value: overview?.totalUsers || 0 },
      { label: 'Active Doctors', value: overview?.activeDoctors || 0 },
      { label: 'Total Patients', value: overview?.totalPatients || 0 },
      { label: 'Total Blogs', value: overview?.totalBlogs || 0 },
      { label: 'High-Risk Vitals', value: overview?.highRiskVitals || 0 }
    ],
    [overview]
  );

  const riskTotal = useMemo(() => {
    if (!performance) return 0;
    return (
      performance.riskDistribution.normal +
      performance.riskDistribution.medium +
      performance.riskDistribution.high
    );
  }, [performance]);

  const riskChartBackground = useMemo(() => {
    if (!performance || riskTotal <= 0) {
      return 'conic-gradient(#d1d5db 0deg 360deg)';
    }

    const normalDeg = (performance.riskDistribution.normal / riskTotal) * 360;
    const mediumDeg = (performance.riskDistribution.medium / riskTotal) * 360;

    return `conic-gradient(#16a34a 0deg ${normalDeg}deg, #f59e0b ${normalDeg}deg ${normalDeg + mediumDeg}deg, #ef4444 ${normalDeg + mediumDeg}deg 360deg)`;
  }, [performance, riskTotal]);

  if (loading) {
    return <p className="admin-page-status">Loading analytics dashboard...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>Platform Analytics</h2>
          <small>Auto-refresh: every 30s{lastUpdated ? ` | Last update: ${lastUpdated.toLocaleTimeString()}` : ''}</small>
        </div>
        <div className="admin-inline-actions">
          <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
          <button type="button" className="admin-secondary-button" onClick={() => setRefreshTick((value) => value + 1)}>
            Refresh now
          </button>
          <button type="button" className="admin-primary-button" onClick={() => window.print()}>
            Export Full Report PDF
          </button>
        </div>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <section className="admin-kpi-grid admin-kpi-grid-tight">
        {snapshotCards.map((card) => (
          <article key={card.label} className="admin-kpi-card">
            <p>{card.label}</p>
            <h3>{formatNumber(card.value)}</h3>
            <small className="admin-kpi-caption">Current platform snapshot</small>
          </article>
        ))}
      </section>

      <section className="admin-mini-kpi-grid">
        {headlineCards.map((card) => (
          <article key={card.label} className="admin-mini-kpi-card">
            <p>{card.label}</p>
            <h3>{formatNumber(card.value)}</h3>
            <small
              className={
                card.change.startsWith('-') ? 'down' : card.change.startsWith('+') ? 'up' : 'flat'
              }
            >
              {card.change.startsWith('+') || card.change.startsWith('-')
                ? `${card.change} vs previous`
                : card.change}
            </small>
          </article>
        ))}
      </section>

      <section className="admin-analytics-charts-row">
        <article className="admin-card">
          <div className="admin-card-head">
            <h3>New Registrations Over Time</h3>
          </div>
          {growth && growth.patientsDaily.length > 1 ? (
            <>
              <svg className="admin-analytics-chart" viewBox={`0 0 ${width} ${height}`}>
                {[0, 1, 2, 3, 4].map((tick) => {
                  const y = 24 + tick * ((height - 48) / 4);
                  return <line key={tick} x1="24" y1={y} x2={width - 24} y2={y} className="admin-chart-grid" />;
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
            <p className="admin-empty-state">Not enough registration data yet.</p>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <h3>Daily Vitals Submissions</h3>
          </div>
          {growth && growth.vitalsDaily.length > 1 ? (
            <svg className="admin-analytics-chart" viewBox={`0 0 ${width} ${height}`}>
              {[0, 1, 2, 3, 4].map((tick) => {
                const y = 24 + tick * ((height - 48) / 4);
                return <line key={tick} x1="24" y1={y} x2={width - 24} y2={y} className="admin-chart-grid" />;
              })}
              <path d={vitalsArea} className="admin-chart-area" />
              <path d={vitalsLine} className="admin-chart-line vitals" />
            </svg>
          ) : (
            <p className="admin-empty-state">Not enough vitals data yet.</p>
          )}
        </article>
      </section>

      <section className="admin-analytics-secondary-row">
        <article className="admin-card">
          <div className="admin-card-head">
            <h3>Most Active Doctors</h3>
            <small>Top 5</small>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Patients</th>
                  <th>Appointments</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {(performance?.topDoctors || []).length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <p className="admin-empty-state">No doctor activity data yet.</p>
                    </td>
                  </tr>
                ) : (
                  (performance?.topDoctors || []).map((row, index) => (
                    <tr key={String(row.doctorId)}>
                      <td>{index + 1}</td>
                      <td>{row.user?.fullName || 'Doctor'}</td>
                      <td>{row.profile?.specialization || '-'}</td>
                      <td>{row.patientsCount}</td>
                      <td>{row.appointments}</td>
                      <td>{row.profile?.rating || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <h3>Appointment Conversion</h3>
          </div>

          {performance ? (
            <div className="admin-funnel-grid">
              {[
                ['Requested', performance.appointmentFunnel.requested],
                ['Confirmed', performance.appointmentFunnel.confirmed],
                ['Completed', performance.appointmentFunnel.completed],
                ['Cancelled', performance.appointmentFunnel.cancelled]
              ].map(([label, value]) => {
                const requested = performance.appointmentFunnel.requested || 1;
                const percentage = Math.round((Number(value) / requested) * 100);

                return (
                  <div key={String(label)}>
                    <p>{label}</p>
                    <div className="admin-funnel-bar-track">
                      <span className="admin-funnel-bar" style={{ width: `${Math.max(10, percentage)}%` }} />
                    </div>
                    <small>
                      {formatNumber(Number(value))} ({percentage}%)
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="admin-empty-state">No funnel data available.</p>
          )}
        </article>
      </section>

      <article className="admin-card">
        <div className="admin-card-head">
          <h3>Blog Performance</h3>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Title</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Category</th>
                <th>Published Date</th>
              </tr>
            </thead>
            <tbody>
              {(blogs?.topBlogs || []).length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="admin-empty-state">No blog performance entries.</p>
                  </td>
                </tr>
              ) : (
                (blogs?.topBlogs || []).map((blog, index) => (
                  <tr key={blog._id}>
                    <td>{index + 1}</td>
                    <td>{blog.title}</td>
                    <td>{blog.views}</td>
                    <td>{blog.likes}</td>
                    <td>{blog.category || '-'}</td>
                    <td>{formatDate(blog.publishedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <section className="admin-risk-row">
        <article className="admin-card">
          <div className="admin-card-head">
            <h3>Patient Risk Distribution (Today)</h3>
          </div>

          {performance ? (
            <div className="admin-risk-grid">
              <div className="admin-risk-donut" style={{ background: riskChartBackground }} />
              <ul className="admin-risk-legend">
                <li>
                  <span className="dot normal" />
                  Normal: {formatNumber(performance.riskDistribution.normal)}
                </li>
                <li>
                  <span className="dot medium" />
                  Medium: {formatNumber(performance.riskDistribution.medium)}
                </li>
                <li>
                  <span className="dot high" />
                  High: {formatNumber(performance.riskDistribution.high)}
                </li>
              </ul>
            </div>
          ) : (
            <p className="admin-empty-state">No risk distribution data available.</p>
          )}
        </article>
      </section>

      <section className="admin-export-banner">
        <p>Download complete analytics report as PDF</p>
        <button type="button" className="admin-primary-button" onClick={() => window.print()}>
          Export report
        </button>
      </section>
    </section>
  );
}
