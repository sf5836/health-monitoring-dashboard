import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import patientService, {
  type ConnectedDoctor,
  type CreateAppointmentPayload,
  type PatientAppointment
} from '../../services/patientService';

type AppointmentTab = 'upcoming' | 'past' | 'cancelled';

function humanType(type: PatientAppointment['type']): string {
  return type === 'teleconsult' ? 'Teleconsult' : 'In-person';
}

export default function AppointmentsPage() {
  const session = authService.getSession();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [doctors, setDoctors] = useState<ConnectedDoctor[]>([]);
  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateAppointmentPayload>({
    doctorId: '',
    type: 'in_person',
    date: '',
    time: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [nextAppointments, nextDoctors] = await Promise.all([
        patientService.getMyAppointments(),
        patientService.getMyDoctors()
      ]);
      setAppointments(nextAppointments);
      setDoctors(nextDoctors);
      if (!form.doctorId && nextDoctors.length > 0) {
        setForm((prev) => ({ ...prev, doctorId: nextDoctors[0].userId._id }));
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (activeTab === 'upcoming') {
      return appointments.filter((item) => item.status === 'pending' || item.status === 'confirmed');
    }
    if (activeTab === 'past') {
      return appointments.filter((item) => item.status === 'completed');
    }
    return appointments.filter((item) => item.status === 'cancelled');
  }, [activeTab, appointments]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    const payload = {
      ...form,
      notes: form.notes?.trim() || undefined
    };
    try {
      await patientService.createMyAppointment(payload);
      await loadData();
      setForm((prev) => ({ ...prev, date: '', time: '', notes: '' }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await patientService.cancelMyAppointment(appointmentId);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to cancel appointment');
    }
  };

  if (!session) {
    return (
      <section className="placeholder-page">
        <h2>Appointments</h2>
        <p>Please login as a patient to view live appointments.</p>
        <Link to="/login">Go to Login</Link>
      </section>
    );
  }

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <section className="hm-section-head">
        <h2>My Appointments</h2>
        <p>Live data from backend</p>
      </section>

      <section className="hm-card" style={{ marginBottom: '1rem' }}>
        <h3>Book New Appointment</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.8rem' }}>
          <select
            value={form.doctorId}
            onChange={(event) => setForm((prev) => ({ ...prev, doctorId: event.target.value }))}
            required
          >
            {doctors.length === 0 ? <option value="">No connected doctors</option> : null}
            {doctors.map((doctor) => (
              <option key={doctor.userId._id} value={doctor.userId._id}>
                {doctor.userId.fullName} {doctor.specialization ? `(${doctor.specialization})` : ''}
              </option>
            ))}
          </select>

          <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as CreateAppointmentPayload['type'] }))
              }
            >
              <option value="in_person">In-person</option>
              <option value="teleconsult">Teleconsult</option>
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
            <input
              type="time"
              value={form.time}
              onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
              required
            />
          </div>

          <textarea
            rows={3}
            placeholder="Notes (optional)"
            value={form.notes || ''}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />

          <button className="hm-btn hm-btn-primary" type="submit" disabled={submitting || doctors.length === 0}>
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </section>

      <section className="hm-card">
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <button className="hm-btn hm-btn-outline" type="button" onClick={() => setActiveTab('upcoming')}>
            Upcoming
          </button>
          <button className="hm-btn hm-btn-outline" type="button" onClick={() => setActiveTab('past')}>
            Past
          </button>
          <button className="hm-btn hm-btn-outline" type="button" onClick={() => setActiveTab('cancelled')}>
            Cancelled
          </button>
        </div>

        {loading ? <p>Loading appointments...</p> : null}
        {errorMessage ? <p>{errorMessage}</p> : null}

        {!loading && filteredAppointments.length === 0 ? <p>No appointments found in this tab.</p> : null}

        {filteredAppointments.map((appointment) => (
          <article key={appointment._id} className="hm-card" style={{ marginTop: '0.8rem' }}>
            <h4>
              {appointment.date} {appointment.time} - {humanType(appointment.type)}
            </h4>
            <p>
              Doctor: {appointment.doctorId?.fullName || 'Doctor'} | Status: {appointment.status}
            </p>
            {appointment.notes ? <p>Notes: {appointment.notes}</p> : null}
            {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
              <button
                className="hm-btn hm-btn-outline"
                type="button"
                onClick={() => handleCancel(appointment._id)}
              >
                Cancel Appointment
              </button>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
