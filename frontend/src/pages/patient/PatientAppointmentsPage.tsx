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

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00'
];

function appointmentDateTime(appointment: PortalAppointment): Date | null {
  if (!appointment.date || !appointment.time) return null;
  const parsed = new Date(`${appointment.date}T${appointment.time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isJoinCallAvailable(appointment: PortalAppointment): boolean {
  if (appointment.type !== 'teleconsult' || appointment.status === 'cancelled') return false;
  const slot = appointmentDateTime(appointment);
  if (!slot) return false;

  const diff = slot.getTime() - Date.now();
  return diff <= 60 * 60 * 1000 && diff >= 0;
}

function statusClass(status: PortalAppointment['status']): string {
  if (status === 'confirmed' || status === 'completed') return 'is-risk-normal';
  if (status === 'pending') return 'is-risk-medium';
  return 'is-risk-high';
}

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
        setBookingForm((previous) => ({
          ...previous,
          doctorId: previous.doctorId || doctorData[0]?.doctorUserId || ''
        }));
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
  }, []);

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
      setBookingForm((previous) => ({
        ...previous,
        date: '',
        time: '',
        notes: ''
      }));
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
    <section className="patient-page patient-appointments-page">
      <header className="patient-page-head">
        <div>
          <h2>Appointments</h2>
          <p>Manage your upcoming and completed consultations</p>
        </div>
        <button type="button" className="patient-primary-button" onClick={() => setIsBookingOpen(true)}>
          Book Appointment
        </button>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <section className="patient-tab-row patient-appointment-tabs">
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
          <ul className="patient-list patient-appointment-list">
            {visibleAppointments.map((appointment) => (
              <li
                key={appointment.id}
                className={`patient-list-item patient-appointment-row is-${appointment.type}`}
              >
                <div className="patient-appointment-main">
                  <div className="patient-appointment-topline">
                    <p className="patient-appointment-datetime">
                      {appointment.date} at {appointment.time}
                    </p>
                    <span className="patient-appointment-type-pill">
                      {appointment.type === 'teleconsult' ? 'Teleconsult' : 'In-person'}
                    </span>
                    <span className={`patient-risk-pill ${statusClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <p className="patient-appointment-doctor">{appointment.doctorName}</p>
                  {appointment.notes ? <small>{appointment.notes}</small> : null}
                </div>

                <div className="patient-inline-actions patient-appointment-actions">
                  {activeTab === 'upcoming' ? (
                    <>
                      <button
                        type="button"
                        className="patient-link-button danger"
                        disabled={busyAppointmentId === appointment.id}
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Cancel Appointment
                      </button>
                      <button
                        type="button"
                        className="patient-secondary-button"
                        disabled={busyAppointmentId === appointment.id}
                        onClick={() => handleReschedule(appointment)}
                      >
                        Reschedule
                      </button>

                      {isJoinCallAvailable(appointment) ? (
                        <button type="button" className="patient-primary-button">
                          Join Call
                        </button>
                      ) : null}
                    </>
                  ) : activeTab === 'past' ? (
                    <button type="button" className="patient-link-button">
                      View Summary
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      {isBookingOpen ? (
        <section className="patient-modal-backdrop" role="dialog" aria-modal="true">
          <article className="patient-modal patient-appointment-modal">
            <header className="patient-card-head">
              <h3>Book New Appointment</h3>
              <button type="button" className="patient-link-button" onClick={() => setIsBookingOpen(false)}>
                Close
              </button>
            </header>

            <form className="patient-form-grid" onSubmit={handleBookAppointment}>
              <label className="patient-form-span-2">
                Doctor
                <select
                  value={bookingForm.doctorId}
                  onChange={(event) =>
                    setBookingForm((previous) => ({ ...previous, doctorId: event.target.value }))
                  }
                >
                  {connectedDoctors.length === 0 ? <option value="">No connected doctors</option> : null}
                  {connectedDoctors.map((doctor) => (
                    <option key={doctor.doctorUserId} value={doctor.doctorUserId}>
                      {doctor.fullName} ({doctor.specialization || 'Specialist'})
                    </option>
                  ))}
                </select>
              </label>

              <div className="patient-form-span-2 patient-appointment-type-toggle">
                <button
                  type="button"
                  className={`patient-tab-pill ${bookingForm.type === 'in_person' ? 'is-active' : ''}`}
                  onClick={() => setBookingForm((previous) => ({ ...previous, type: 'in_person' }))}
                >
                  In-person
                </button>
                <button
                  type="button"
                  className={`patient-tab-pill ${bookingForm.type === 'teleconsult' ? 'is-active' : ''}`}
                  onClick={() => setBookingForm((previous) => ({ ...previous, type: 'teleconsult' }))}
                >
                  Teleconsult
                </button>
              </div>

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

              <div>
                <p className="patient-card-title">Time Slot</p>
                <div className="patient-time-slot-grid">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`patient-time-slot ${bookingForm.time === slot ? 'is-active' : ''}`}
                      onClick={() => setBookingForm((previous) => ({ ...previous, time: slot }))}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

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
