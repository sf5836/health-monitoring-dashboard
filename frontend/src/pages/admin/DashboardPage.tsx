import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService, { type AdminDashboardStats } from '../../services/adminService';
import { ApiError } from '../../services/apiClient';

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    adminService
      .getDashboard()
      .then(setStats)
      .catch((error: unknown) => setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load dashboard'));
  }, []);

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Admin Dashboard</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <section className="hm-grid-3" style={{ marginTop: '1rem' }}>
        <article className="hm-card"><p>Doctors (Total)</p><h3>{stats?.doctors.total || 0}</h3></article>
        <article className="hm-card"><p>Doctors (Pending)</p><h3>{stats?.doctors.pending || 0}</h3></article>
        <article className="hm-card"><p>Patients</p><h3>{stats?.patients.total || 0}</h3></article>
        <article className="hm-card"><p>Blogs (Pending)</p><h3>{stats?.blogs.pending || 0}</h3></article>
        <article className="hm-card"><p>High Risk Vitals</p><h3>{stats?.clinical.highRiskVitals || 0}</h3></article>
        <article className="hm-card"><p>Active Appointments</p><h3>{stats?.clinical.activeAppointments || 0}</h3></article>
      </section>
      <div className="hm-hero-actions" style={{ marginTop: '1rem' }}>
        <Link className="hm-btn hm-btn-outline" to="/admin/doctors">Manage Doctors</Link>
        <Link className="hm-btn hm-btn-outline" to="/admin/blogs">Moderate Blogs</Link>
        <Link className="hm-btn hm-btn-primary" to="/admin/analytics">Analytics</Link>
      </div>
    </main>
  );
}
