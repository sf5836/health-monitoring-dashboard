import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ROUTE_PATHS } from '../../routes/routePaths';
import {
  getConnectedDoctors,
  getPatientDashboard,
  getPatientPrescriptions,
  getPatientTrends,
  type ConnectedDoctor,
  type PortalDashboard,
  type PortalPrescription,
  type PortalVitalRecord
} from '../../services/patientPortalService';
import {
  formatBloodPressure,
  formatDate,
  formatDateTime,
  greetingByTime,
  riskClass,
  riskLabel
} from './patientUi';

function metricSeries(vitals: PortalVitalRecord[], picker: (item: PortalVitalRecord) => number | undefined): number[] {
  return vitals
    .map((item) => picker(item))
    .filter((value): value is number => Number.isFinite(value));
}

function sparklinePath(values: number[], width = 180, height = 56): string {
  if (values.length === 0) return `M 0 ${height / 2} L ${width} ${height / 2}`;
  if (values.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function renderVitalsSummary(vital: PortalVitalRecord): string {
  return [
    formatBloodPressure(vital.bloodPressure) !== '-' ? `BP ${formatBloodPressure(vital.bloodPressure)}` : '',
    vital.heartRate ? `HR ${vital.heartRate}` : '',
    vital.glucose?.value ? `Glucose ${vital.glucose.value}` : '',
    vital.spo2 ? `SpO2 ${vital.spo2}%` : ''
  ]
    .filter(Boolean)
    .join(' | ');
}

export default function PatientDashboardPage() {
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [doctors, setDoctors] = useState<ConnectedDoctor[]>([]);
  const [prescriptions, setPrescriptions] = useState<PortalPrescription[]>([]);
  const [weeklyVitals, setWeeklyVitals] = useState<PortalVitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboardData, connectedDoctors, prescriptionData, trendsData] = await Promise.all([
          getPatientDashboard(),
          getConnectedDoctors(),
          getPatientPrescriptions(),
          getPatientTrends(7)
        ]);

        if (cancelled) return;

        setDashboard(dashboardData);
        setDoctors(connectedDoctors);
        setPrescriptions(prescriptionData);
        setWeeklyVitals(trendsData.vitals);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load dashboard data from backend right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const latestVital = dashboard?.latestVitals[0];
  const previousVital = dashboard?.latestVitals[1];

  const quickStats = useMemo(() => {
    if (!latestVital) {
      return [
        { label: 'Blood Pressure', value: '-', unit: 'mmHg', delta: '-', risk: 'normal' as const },
        { label: 'Heart Rate', value: '-', unit: 'bpm', delta: '-', risk: 'normal' as const },
        { label: 'Blood Glucose', value: '-', unit: 'mg/dL', delta: '-', risk: 'normal' as const },
        { label: 'Oxygen (SpO2)', value: '-', unit: '%', delta: '-', risk: 'normal' as const }
      ];
    }

    const bpDelta =
      latestVital.bloodPressure?.systolic && previousVital?.bloodPressure?.systolic
        ? latestVital.bloodPressure.systolic - previousVital.bloodPressure.systolic
        : null;

    return [
      {
        label: 'Blood Pressure',
        value: formatBloodPressure(latestVital.bloodPressure),
        unit: 'mmHg',
        delta: bpDelta === null ? '-' : `${bpDelta > 0 ? '+' : ''}${bpDelta} vs previous`,
        risk: latestVital.riskLevel
      },
      {
        label: 'Heart Rate',
        value: latestVital.heartRate ? String(latestVital.heartRate) : '-',
        unit: 'bpm',
        delta:
          latestVital.heartRate && previousVital?.heartRate
            ? `${latestVital.heartRate - previousVital.heartRate} vs previous`
            : '-',
        risk: latestVital.riskLevel
      },
      {
        label: 'Blood Glucose',
        value: latestVital.glucose?.value ? String(latestVital.glucose.value) : '-',
        unit: 'mg/dL',
        delta: '-',
        risk: latestVital.riskLevel
      },
      {
        label: 'Oxygen (SpO2)',
        value: latestVital.spo2 ? String(latestVital.spo2) : '-',
        unit: '%',
        delta: '-',
        risk: latestVital.riskLevel
      }
    ];
  }, [latestVital, previousVital]);

  const sparklineCards = useMemo(() => {
    const heartRates = metricSeries(weeklyVitals, (item) => item.heartRate);
    const spo2 = metricSeries(weeklyVitals, (item) => item.spo2);
    const glucose = metricSeries(weeklyVitals, (item) => item.glucose?.value);
    const systolic = metricSeries(weeklyVitals, (item) => item.bloodPressure?.systolic);

    return [
      {
        title: 'Heart Rate',
        latest: heartRates.length > 0 ? heartRates[heartRates.length - 1] : undefined,
        unit: 'bpm',
        path: sparklinePath(heartRates)
      },
      {
        title: 'SpO2',
        latest: spo2.length > 0 ? spo2[spo2.length - 1] : undefined,
        unit: '%',
        path: sparklinePath(spo2)
      },
      {
        title: 'Glucose',
        latest: glucose.length > 0 ? glucose[glucose.length - 1] : undefined,
        unit: 'mg/dL',
        path: sparklinePath(glucose)
      },
      {
        title: 'Systolic BP',
        latest: systolic.length > 0 ? systolic[systolic.length - 1] : undefined,
        unit: 'mmHg',
        path: sparklinePath(systolic)
      }
    ];
  }, [weeklyVitals]);

  if (loading) {
    return <p className="patient-page-status">Loading patient dashboard...</p>;
  }

  return (
    <section className="patient-page">
      {error ? <p className="patient-error-banner">{error}</p> : null}

      <article className="patient-welcome-banner">
        <div>
          <p className="patient-eyebrow">{greetingByTime()}</p>
          <h2>Health Overview</h2>
          <p>{formatDate(new Date().toISOString())}</p>
        </div>
        <div className="patient-welcome-metrics">
          <p>High Risk Alerts: {dashboard?.metrics.highRiskCount || 0}</p>
          <p>Upcoming Appointments: {dashboard?.metrics.upcomingAppointments || 0}</p>
          <p>Active Prescriptions: {dashboard?.metrics.prescriptionCount || 0}</p>
        </div>
      </article>

      <section className="patient-grid patient-quick-stats-grid">
        {quickStats.map((item) => (
          <article key={item.label} className="patient-card patient-stat-card">
            <p className="patient-card-title">{item.label}</p>
            <p className="patient-metric-value">
              {item.value} <span>{item.unit}</span>
            </p>
            <p className={`patient-risk-pill ${riskClass(item.risk)}`}>{riskLabel(item.risk)}</p>
            <small>{item.delta}</small>
          </article>
        ))}
      </section>

      <section className="patient-grid patient-sparkline-grid">
        {sparklineCards.map((item) => (
          <article key={item.title} className="patient-card patient-sparkline-card">
            <div className="patient-sparkline-head">
              <p>{item.title}</p>
              <strong>
                {item.latest ?? '-'} {item.unit}
              </strong>
            </div>
            <svg viewBox="0 0 180 56" preserveAspectRatio="none" aria-label={`${item.title} trend`}>
              <path d={item.path} className="patient-sparkline-path" />
            </svg>
          </article>
        ))}
      </section>

      <section className="patient-grid patient-main-grid">
        <article className="patient-card">
          <div className="patient-card-head">
            <h3>Recent Vital Entries</h3>
            <Link to={ROUTE_PATHS.patient.vitals} className="patient-link-button">
              Log New Vitals
            </Link>
          </div>

          {dashboard?.latestVitals.length ? (
            <ul className="patient-list">
              {dashboard.latestVitals.map((vital) => (
                <li key={vital.id} className="patient-list-item">
                  <div>
                    <p>{renderVitalsSummary(vital) || 'No values submitted'}</p>
                    <small>{formatDateTime(vital.datetime)}</small>
                  </div>
                  <span className={`patient-risk-pill ${riskClass(vital.riskLevel)}`}>
                    {riskLabel(vital.riskLevel)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="patient-empty-state">No vital entries yet. Add your first reading.</p>
          )}
        </article>

        <div className="patient-column-stack">
          <article className="patient-card">
            <h3>Upcoming Appointments</h3>
            {dashboard?.upcomingAppointments.length ? (
              <ul className="patient-list">
                {dashboard.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <li key={appointment.id} className="patient-list-item">
                    <div>
                      <p>{appointment.doctorName}</p>
                      <small>
                        {appointment.date} at {appointment.time} ({appointment.type})
                      </small>
                    </div>
                    <Link to={ROUTE_PATHS.patient.appointments} className="patient-link-button">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="patient-empty-state">No upcoming appointments.</p>
            )}
          </article>

          <article className="patient-card">
            <h3>Connected Doctors</h3>
            {doctors.length ? (
              <ul className="patient-list">
                {doctors.slice(0, 3).map((doctor) => (
                  <li key={doctor.doctorUserId} className="patient-list-item">
                    <div>
                      <p>{doctor.fullName}</p>
                      <small>{doctor.specialization || 'Specialist'}</small>
                    </div>
                    <Link to={ROUTE_PATHS.patient.messages} className="patient-link-button">
                      Message
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="patient-empty-state">No doctors connected yet.</p>
            )}
          </article>

          <article className="patient-card">
            <h3>Active Prescriptions</h3>
            <p className="patient-empty-state">
              {prescriptions.length > 0
                ? `${prescriptions.length} prescriptions available. Latest: ${prescriptions[0].diagnosis || 'General care'}`
                : 'No prescriptions available.'}
            </p>
          </article>
        </div>
      </section>

      <section className="patient-grid patient-action-grid">
        <Link to={ROUTE_PATHS.patient.vitals} className="patient-action-card">
          Log Vitals
        </Link>
        <Link to={ROUTE_PATHS.patient.doctors} className="patient-action-card">
          Find Doctor
        </Link>
        <Link to={ROUTE_PATHS.patient.appointments} className="patient-action-card">
          Book Appointment
        </Link>
      </section>
    </section>
  );
}
