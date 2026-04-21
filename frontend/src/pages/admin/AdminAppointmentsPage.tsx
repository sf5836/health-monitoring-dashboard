import { useEffect, useMemo, useState } from 'react';
import { getAdminAppointments, type AdminAppointment } from '../../services/adminPortalService';
import { formatDate } from './adminUi';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminAppointment['status']>('all');

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      try {
        const data = await getAdminAppointments();
        if (cancelled) return;
        setAppointments(data);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load appointment data.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter((appointment) => appointment.status === statusFilter);
  }, [appointments, statusFilter]);

  if (loading) {
    return <p className="admin-page-status">Loading appointments...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>Appointments</h2>
          <p>Global appointment command center</p>
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <article className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {visibleAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <p className="admin-empty-state">No appointments in this filter.</p>
                  </td>
                </tr>
              ) : (
                visibleAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.patientName}</td>
                    <td>{appointment.doctorName}</td>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.time}</td>
                    <td>{appointment.type === 'teleconsult' ? 'Teleconsult' : 'In-person'}</td>
                    <td>{appointment.status}</td>
                    <td>{appointment.createdBy || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
