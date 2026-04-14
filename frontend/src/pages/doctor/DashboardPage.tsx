import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import doctorService, { type DoctorDashboardMetrics } from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DoctorDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    doctorService
      .getMyDashboard()
      .then(setMetrics)
      .catch((error: unknown) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Doctor Dashboard</h2>
      {loading ? <p>Loading dashboard...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      <section className="hm-grid-3" style={{ marginTop: '1rem' }}>
        <article className="hm-card"><p>Connected Patients</p><h3>{metrics?.connectedPatients ?? 0}</h3></article>
        <article className="hm-card"><p>High Risk Patients</p><h3>{metrics?.highRiskPatients ?? 0}</h3></article>
        <article className="hm-card"><p>Pending Appointments</p><h3>{metrics?.pendingAppointments ?? 0}</h3></article>
        <article className="hm-card"><p>Completed Appointments</p><h3>{metrics?.completedAppointments ?? 0}</h3></article>
        <article className="hm-card"><p>Prescriptions</p><h3>{metrics?.prescriptionCount ?? 0}</h3></article>
        <article className="hm-card"><p>Draft Blogs</p><h3>{metrics?.draftBlogs ?? 0}</h3></article>
      </section>

      <div className="hm-hero-actions" style={{ marginTop: '1rem' }}>
        <Link className="hm-btn hm-btn-outline" to="/doctor/patients">My Patients</Link>
        <Link className="hm-btn hm-btn-outline" to="/doctor/appointments">Appointments</Link>
        <Link className="hm-btn hm-btn-primary" to="/doctor/blogs">My Blogs</Link>
      </div>
    </main>
  );
}
