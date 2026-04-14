import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import patientService, { type PatientDashboard } from '../../services/patientService';

function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

export default function DashboardPage() {
  const session = authService.getSession();
  const [dashboard, setDashboard] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    patientService
      .getMyDashboard()
      .then((data) => setDashboard(data))
      .catch((error: unknown) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  const latest = dashboard?.latestVitals?.[0];

  const cards = useMemo(
    () => [
      {
        label: 'High Risk Alerts',
        value: String(dashboard?.metrics.highRiskCount ?? 0),
        detail: 'From recent vital records'
      },
      {
        label: 'Upcoming Appointments',
        value: String(dashboard?.metrics.upcomingAppointments ?? 0),
        detail: 'Pending and confirmed'
      },
      {
        label: 'Active Prescriptions',
        value: String(dashboard?.metrics.prescriptionCount ?? 0),
        detail: 'Total prescriptions issued'
      },
      {
        label: 'Last Update',
        value: latest ? formatDateTime(latest.datetime) : '-',
        detail: latest?.riskLevel ? `Risk: ${latest.riskLevel}` : 'No vitals logged yet'
      }
    ],
    [dashboard, latest]
  );

  if (!session) {
    return (
      <section className="placeholder-page">
        <h2>Patient Dashboard</h2>
        <p>Please login as a patient to see your dashboard.</p>
        <Link to="/login">Go to Login</Link>
      </section>
    );
  }

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <section className="hm-section-head">
        <h2>Welcome, {session.user.fullName}</h2>
        <p>Live backend metrics</p>
      </section>

      {loading ? <p>Loading dashboard...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      <section className="hm-grid-3" style={{ marginTop: '1rem' }}>
        {cards.map((card) => (
          <article key={card.label} className="hm-card">
            <p className="hm-meta">{card.label}</p>
            <h3>{card.value}</h3>
            <small>{card.detail}</small>
          </article>
        ))}
      </section>

      <section className="hm-grid-3" style={{ marginTop: '1rem' }}>
        <article className="hm-card" style={{ gridColumn: 'span 2' }}>
          <h3>Recent Vital Entries</h3>
          {!dashboard?.latestVitals?.length ? <p>No vitals recorded yet.</p> : null}
          {dashboard?.latestVitals?.map((vital) => (
            <article key={vital._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
              <p>
                {formatDateTime(vital.datetime)} | Risk: {vital.riskLevel || 'normal'}
              </p>
              <p>
                BP: {vital.bloodPressure?.systolic ?? '-'} / {vital.bloodPressure?.diastolic ?? '-'} | HR:{' '}
                {vital.heartRate ?? '-'} | SpO2: {vital.spo2 ?? '-'} | Glucose: {vital.glucose?.value ?? '-'}
              </p>
            </article>
          ))}
        </article>

        <article className="hm-card">
          <h3>Upcoming Appointments</h3>
          {!dashboard?.upcomingAppointments?.length ? <p>No upcoming appointments.</p> : null}
          {dashboard?.upcomingAppointments?.map((item) => (
            <article key={item._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
              <p>
                {item.date} {item.time}
              </p>
              <small>
                {item.doctorId?.fullName || 'Doctor'} | {item.type} | {item.status}
              </small>
            </article>
          ))}
        </article>
      </section>

      <section className="hm-hero-actions" style={{ marginTop: '1rem' }}>
        <Link className="hm-btn hm-btn-outline" to="/patient/vitals">
          View My Vitals
        </Link>
        <Link className="hm-btn hm-btn-primary" to="/patient/appointments">
          Manage Appointments
        </Link>
      </section>
    </main>
  );
}
