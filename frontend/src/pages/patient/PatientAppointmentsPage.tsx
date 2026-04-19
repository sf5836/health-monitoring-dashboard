import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  cancelPatientAppointment,
  createPatientAppointment,
  getConnectedDoctors,
  getPatientAppointments,
  updatePatientAppointment,
  type ConnectedDoctor,
  type PortalAppointment
} from '../../services/patientPortalService';

type AppointmentTab = 'upcoming' | 'past' | 'cancelled';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [connectedDoctors, setConnectedDoctors] = useState<ConnectedDoctor[]>([]);
  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyAppointmentId, setBusyAppointmentId] = useState('');
  const [error, setError] = useState('');

  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    type: 'in_person' as 'in_person' | 'teleconsult',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [appointmentData, doctorData] = await Promise.all([
          getPatientAppointments(),
          getConnectedDoctors()
        ]);

        if (cancelled) return;

        setAppointments(appointmentData);
        setConnectedDoctors(doctorData);
        if (!bookingForm.doctorId && doctorData[0]) {
          setBookingForm((previous) => ({ ...previous, doctorId: doctorData[0].doctorUserId }));
        }
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load appointments.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [bookingForm.doctorId]);

  const categorized = useMemo(() => {
    const upcoming: PortalAppointment[] = [];
    const past: PortalAppointment[] = [];
    const cancelled: PortalAppointment[] = [];

    for (const appointment of appointments) {
      if (appointment.status === 'cancelled') {
        cancelled.push(appointment);
      } else if (appointment.status === 'completed') {
        past.push(appointment);
      } else {
        upcoming.push(appointment);
      }
    }

    return { upcoming, past, cancelled };
  }, [appointments]);

  const visibleAppointments = categorized[activeTab];

  async function handleBookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!bookingForm.doctorId || !bookingForm.date || !bookingForm.time) {
      setError('Doctor, date, and time are required.');
      return;
    }

    try {
      const created = await createPatientAppointment(bookingForm);
      setAppointments((previous) => [created, ...previous]);
      setIsBookingOpen(false);
      setBookingForm((previous) => ({ ...previous, notes: '' }));
      setActiveTab('upcoming');
    } catch {
      setError('Unable to create appointment. Please verify doctor connection and try again.');
    }
  }

  async function handleCancel(appointmentId: string) {
    const shouldCancel = window.confirm('Cancel this appointment?');
    if (!shouldCancel) return;

    try {
      setBusyAppointmentId(appointmentId);
      const updated = await cancelPatientAppointment(appointmentId);
      setAppointments((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setError('Unable to cancel appointment.');
    } finally {
      setBusyAppointmentId('');
    }
  }

  async function handleReschedule(appointment: PortalAppointment) {
    const nextDate = window.prompt('Enter new appointment date (YYYY-MM-DD)', appointment.date);
    if (!nextDate) return;
    const nextTime = window.prompt('Enter new appointment time (HH:mm)', appointment.time);
    if (!nextTime) return;

    try {
      setBusyAppointmentId(appointment.id);
      const updated = await updatePatientAppointment(appointment.id, {
        date: nextDate,
        time: nextTime
      });
      setAppointments((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setError('Unable to reschedule appointment.');
    } finally {
      setBusyAppointmentId('');
    }
  }

  return (
    <section className="patient-page">
      <header className="patient-page-head">
        <div>
          <h2>Appointments</h2>
          <p>Manage your upcoming and completed consultations.</p>
        </div>
        <button type="button" className="patient-primary-button" onClick={() => setIsBookingOpen(true)}>
          Book Appointment
        </button>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <section className="patient-tab-row">
        <button
          type="button"
          className={`patient-tab-pill ${activeTab === 'upcoming' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({categorized.upcoming.length})
        </button>
        <button
          type="button"
          className={`patient-tab-pill ${activeTab === 'past' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past ({categorized.past.length})
        </button>
        <button
          type="button"
          className={`patient-tab-pill ${activeTab === 'cancelled' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled ({categorized.cancelled.length})
        </button>
      </section>

      <article className="patient-card">
        {loading ? (
          <p className="patient-page-status">Loading appointments...</p>
        ) : visibleAppointments.length === 0 ? (
          <p className="patient-empty-state">No appointments in this tab.</p>
        ) : (
          <ul className="patient-list">
            {visibleAppointments.map((appointment) => (
              <li key={appointment.id} className={`patient-list-item patient-appointment-row ${appointment.type}`}>
                <div>
                  <p>
                    {appointment.date} at {appointment.time}
                  </p>
                  <small>
                    {appointment.doctorName} | {appointment.type === 'teleconsult' ? 'Teleconsult' : 'In-person'}
                  </small>
                  {appointment.notes ? <small>{appointment.notes}</small> : null}
                </div>

                <div className="patient-inline-actions">
                  <span className={`patient-risk-pill ${appointment.status === 'confirmed' ? 'is-risk-normal' : 'is-risk-medium'}`}>
                    {appointment.status}
                  </span>
                  {activeTab === 'upcoming' ? (
                    <>
                      <button
                        type="button"
                        className="patient-link-button"
                        disabled={busyAppointmentId === appointment.id}
                        onClick={() => handleReschedule(appointment)}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="patient-link-button danger"
                        disabled={busyAppointmentId === appointment.id}
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      {isBookingOpen ? (
        <section className="patient-modal-backdrop" role="dialog" aria-modal="true">
          <article className="patient-modal">
            <header className="patient-card-head">
              <h3>Book New Appointment</h3>
              <button type="button" className="patient-link-button" onClick={() => setIsBookingOpen(false)}>
                Close
              </button>
            </header>

            <form className="patient-form-grid" onSubmit={handleBookAppointment}>
              <label>
                Doctor
                <select
                  value={bookingForm.doctorId}
                  onChange={(event) =>
                    setBookingForm((previous) => ({ ...previous, doctorId: event.target.value }))
                  }
                >
                  {connectedDoctors.map((doctor) => (
                    <option key={doctor.doctorUserId} value={doctor.doctorUserId}>
                      {doctor.fullName} ({doctor.specialization || 'Specialist'})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Appointment Type
                <select
                  value={bookingForm.type}
                  onChange={(event) =>
                    setBookingForm((previous) => ({
                      ...previous,
                      type: event.target.value as 'in_person' | 'teleconsult'
                    }))
                  }
                >
                  <option value="in_person">In-person</option>
                  <option value="teleconsult">Teleconsult</option>
                </select>
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(event) =>
                    setBookingForm((previous) => ({ ...previous, date: event.target.value }))
                  }
                />
              </label>

              <label>
                Time
                <input
                  type="time"
                  value={bookingForm.time}
                  onChange={(event) =>
                    setBookingForm((previous) => ({ ...previous, time: event.target.value }))
                  }
                />
              </label>

              <label className="patient-form-span-2">
                Notes
                <textarea
                  rows={3}
                  value={bookingForm.notes}
                  onChange={(event) =>
                    setBookingForm((previous) => ({ ...previous, notes: event.target.value }))
                  }
                />
              </label>

              <div className="patient-form-actions patient-form-span-2">
                <button type="submit" className="patient-primary-button">
                  Confirm Booking
                </button>
                <button
                  type="button"
                  className="patient-secondary-button"
                  onClick={() => setIsBookingOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </article>
        </section>
      ) : null}
    </section>
  );
}
