import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../services/apiClient';
import {
  getDoctorAppointments,
  getDoctorBlogs,
  getDoctorDashboardMetrics,
  getDoctorInboxOverview,
  getDoctorPatientDetail,
  getDoctorPatients,
  type DoctorAppointment,
  type DoctorDashboardMetrics,
  type DoctorPatientSummary,
  type RiskLevel
} from '../../services/doctorPortalService';
import { ROUTE_PATHS } from '../../routes/routePaths';
import {
  formatBloodPressure,
  formatDate,
  formatDateTime,
  formatTime,
  greetingByTime,
  isTodayDate,
  riskClass,
  riskLabel
} from './doctorUi';

type RiskPatient = {
  patientId: string;
  name: string;
  riskLevel: RiskLevel;
  flaggedVital: string;
  timestamp?: string;
};

type ActivityItem = {
  patientId: string;
  name: string;
  label: string;
  timestamp?: string;
  riskLevel: RiskLevel;
};

function riskRank(value: RiskLevel): number {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}

function resolveFlaggedVital(detail: {
  bloodPressure?: { systolic?: number; diastolic?: number };
  glucose?: { value?: number };
  heartRate?: number;
  spo2?: number;
}): string {
  const bp = formatBloodPressure(detail.bloodPressure);
  if (bp !== '-') return `BP: ${bp} mmHg`;
  if (detail.glucose?.value) return `Glucose: ${detail.glucose.value} mg/dL`;
  if (detail.heartRate) return `HR: ${detail.heartRate} bpm`;
  if (detail.spo2) return `SpO2: ${detail.spo2}%`;
  return 'Vital submitted';
}

function sortAppointmentsByTime(value: DoctorAppointment[]): DoctorAppointment[] {
  return [...value].sort((a, b) => {
    const aRaw = `${a.date} ${a.time}`;
    const bRaw = `${b.date} ${b.time}`;
    const aTime = new Date(aRaw).getTime();
    const bTime = new Date(bRaw).getTime();

    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return String(a.time).localeCompare(String(b.time));
    }

    return aTime - bTime;
  });
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DoctorDashboardMetrics | null>(null);
  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [riskPatients, setRiskPatients] = useState<RiskPatient[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [publishedBlogCount, setPublishedBlogCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [metricData, patientData, appointmentData, blogs, inbox] = await Promise.all([
          getDoctorDashboardMetrics(),
          getDoctorPatients(),
          getDoctorAppointments(),
          getDoctorBlogs(),
          getDoctorInboxOverview(80)
        ]);

        if (cancelled) return;

        setMetrics(metricData);
        setPatients(patientData);
        setAppointments(appointmentData);
        setPublishedBlogCount(blogs.filter((item) => item.status === 'published').length);
        setUnreadMessagesCount(inbox.unreadChatCount);

        const detailRequests = await Promise.allSettled(
          patientData.map((patient) => getDoctorPatientDetail(patient.patientId))
        );

        if (cancelled) return;

        const nextRiskPatients: RiskPatient[] = [];
        const nextActivities: ActivityItem[] = [];

        for (const request of detailRequests) {
          if (request.status !== 'fulfilled') continue;

          const detail = request.value;
          const latestVital = detail.latestVitals[0];
          if (!latestVital) continue;

          const riskLevel = latestVital.riskLevel || 'normal';

          if (riskLevel !== 'normal') {
            nextRiskPatients.push({
              patientId: detail.user.id,
              name: detail.user.fullName,
              riskLevel,
              flaggedVital: resolveFlaggedVital(latestVital),
              timestamp: latestVital.datetime
            });
          }

          nextActivities.push({
            patientId: detail.user.id,
            name: detail.user.fullName,
            label: `${detail.user.fullName} logged vitals`,
            timestamp: latestVital.datetime,
            riskLevel
          });
        }

        setRiskPatients(
          nextRiskPatients
            .sort((a, b) => {
              const rankDelta = riskRank(b.riskLevel) - riskRank(a.riskLevel);
              if (rankDelta !== 0) return rankDelta;
              return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
            })
            .slice(0, 8)
        );

        setActivities(
          nextActivities
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .slice(0, 8)
        );

        setError('');
      } catch (requestError) {
        if (cancelled) return;

        if (requestError instanceof ApiError && requestError.status === 403) {
          navigate(ROUTE_PATHS.doctor.pendingApproval, { replace: true });
          return;
        }

        setError('Unable to load doctor dashboard data from backend right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const todaySchedule = useMemo(() => {
    return sortAppointmentsByTime(appointments)
      .filter((item) => isTodayDate(item.date))
      .slice(0, 6);
  }, [appointments]);

  if (loading) {
    return <p className="doctor-page-status">Loading doctor dashboard...</p>;
  }

  return (
    <section className="doctor-page">
      {error ? <p className="doctor-error-banner">{error}</p> : null}

      <article className="doctor-welcome-banner">
        <div className="doctor-welcome-main">
          <p className="doctor-eyebrow">{greetingByTime()}</p>
          <h2>Welcome back, Doctor</h2>
          <p>{formatDate(new Date().toISOString())}</p>
          <div className="doctor-badge-row">
            <span className="doctor-status-chip approved">Verified Doctor</span>
            <span className="doctor-status-chip">Approved</span>
          </div>
        </div>
        <div className="doctor-welcome-meta">
          <p>Total Patients: {metrics?.connectedPatients || patients.length}</p>
          <p>High Risk Patients: {metrics?.highRiskPatients || riskPatients.length}</p>
          <p>Completed Appointments: {metrics?.completedAppointments || 0}</p>
        </div>
      </article>

      <section className="doctor-grid doctor-stats-grid">
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">👥 Total Patients</p>
          <p className="doctor-stat-value">{metrics?.connectedPatients || patients.length}</p>
        </article>
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">📅 Pending Appointments</p>
          <p className="doctor-stat-value is-warning">{metrics?.pendingAppointments || 0}</p>
        </article>
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">💬 Unread Messages</p>
          <p className="doctor-stat-value">{unreadMessagesCount}</p>
        </article>
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">📝 Published Blogs</p>
          <p className="doctor-stat-value">{publishedBlogCount}</p>
        </article>
      </section>

      <section className="doctor-grid doctor-main-grid">
        <article className="doctor-card doctor-risk-card">
          <div className="doctor-card-head">
            <h3>⚠ Patients Requiring Attention</h3>
            <Link to={ROUTE_PATHS.doctor.patients} className="doctor-link-button">
              View All Patients
            </Link>
          </div>

          {riskPatients.length === 0 ? (
            <p className="doctor-empty-state">No flagged patients right now.</p>
          ) : (
            <ul className="doctor-list">
              {riskPatients.slice(0, 4).map((patient) => (
                <li key={patient.patientId} className="doctor-list-item doctor-risk-list-item">
                  <div>
                    <p>{patient.name}</p>
                    <small>{patient.flaggedVital}</small>
                  </div>
                  <div className="doctor-inline-actions">
                    <span className={`doctor-risk-pill ${riskClass(patient.riskLevel)}`}>
                      {riskLabel(patient.riskLevel)}
                    </span>
                    <Link to={`/doctor/patients/${patient.patientId}`} className="doctor-link-button">
                      View Record
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="doctor-card">
          <div className="doctor-card-head">
            <h3>Today&apos;s Appointments</h3>
            <span className="doctor-count-badge">{todaySchedule.length}</span>
          </div>

          {todaySchedule.length === 0 ? (
            <p className="doctor-empty-state">No appointments for today.</p>
          ) : (
            <ul className="doctor-list">
              {todaySchedule.map((item) => (
                <li key={item.id} className="doctor-list-item">
                  <div>
                    <p>
                      {formatTime(item.time)} - {item.patientName}
                    </p>
                    <small>
                      {item.type === 'teleconsult' ? 'Teleconsult' : 'In-person'} • {item.status}
                    </small>
                  </div>
                  <span className={`doctor-status-dot ${item.type === 'teleconsult' ? 'teal' : 'green'}`} />
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="doctor-grid doctor-lower-grid">
        <article className="doctor-card">
          <div className="doctor-card-head">
            <h3>Recent Patient Activity</h3>
          </div>

          {activities.length === 0 ? (
            <p className="doctor-empty-state">No recent activity available yet.</p>
          ) : (
            <ul className="doctor-list">
              {activities.slice(0, 5).map((item) => (
                <li
                  key={`${item.patientId}-${item.timestamp || ''}`}
                  className={`doctor-list-item ${item.riskLevel === 'high' ? 'is-highlight-danger' : ''}`}
                >
                  <div>
                    <p>{item.label}</p>
                    <small>{formatDateTime(item.timestamp)}</small>
                  </div>
                  <span className={`doctor-risk-pill ${riskClass(item.riskLevel)}`}>
                    {riskLabel(item.riskLevel)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="doctor-card">
          <h3>Quick Actions</h3>
          <div className="doctor-action-stack">
            <Link to={ROUTE_PATHS.doctor.patients} className="doctor-secondary-button doctor-action-button">
              👥 View All Patients
            </Link>
            <Link to={ROUTE_PATHS.doctor.patients} className="doctor-primary-button doctor-action-button">
              💊 New Prescription
            </Link>
            <Link to={ROUTE_PATHS.doctor.blogs} className="doctor-secondary-button doctor-action-button teal">
              📝 Write a Blog
            </Link>
          </div>
        </article>
      </section>
    </section>
  );
}
