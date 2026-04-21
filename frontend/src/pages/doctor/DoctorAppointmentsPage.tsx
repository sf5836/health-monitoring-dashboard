import { useEffect, useState } from 'react';
import {
  getDoctorAppointments,
  updateDoctorAppointment,
  type DoctorAppointment
} from '../../services/doctorPortalService';
import { formatDate, formatTime } from './doctorUi';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      try {
        const data = await getDoctorAppointments();
        if (cancelled) return;
        setAppointments(data);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load appointments right now.');
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

  async function onStatusChange(appointmentId: string, status: DoctorAppointment['status']) {
    try {
      const updated = await updateDoctorAppointment(appointmentId, { status });
      setAppointments((previous) =>
        previous.map((item) => (item.id === appointmentId ? updated : item))
      );
    } catch {
      setError('Unable to update appointment status right now.');
    }
  }

  if (loading) {
    return <p className="doctor-page-status">Loading appointments...</p>;
  }

  return (
    <section className="doctor-page">
      <header className="doctor-page-head">
        <div>
          <h2>Appointments</h2>
          <p>Manage and update patient appointments</p>
        </div>
      </header>

      {error ? <p className="doctor-error-banner">{error}</p> : null}

      <article className="doctor-card">
        {appointments.length === 0 ? (
          <p className="doctor-empty-state">No appointments found.</p>
        ) : (
          <ul className="doctor-list">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="doctor-list-item">
                <div>
                  <p>
                    {appointment.patientName} • {formatDate(appointment.date)} at {formatTime(appointment.time)}
                  </p>
                  <small>
                    {appointment.type === 'teleconsult' ? 'Teleconsult' : 'In-person'} • {appointment.notes || 'No notes'}
                  </small>
                </div>
                <select
                  value={appointment.status}
                  onChange={(event) =>
                    onStatusChange(
                      appointment.id,
                      event.target.value as 'pending' | 'confirmed' | 'completed' | 'cancelled'
                    )
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
