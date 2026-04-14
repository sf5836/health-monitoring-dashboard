import { useEffect, useState } from 'react';
import doctorService, { type DoctorAppointment } from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await doctorService.getMyAppointments();
      setAppointments(data);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setStatus = async (appointmentId: string, status: DoctorAppointment['status']) => {
    try {
      await doctorService.updateMyAppointment(appointmentId, { status });
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to update appointment');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Doctor Appointments</h2>
      {loading ? <p>Loading appointments...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      {appointments.map((item) => (
        <article key={item._id} className="hm-card" style={{ marginTop: '0.8rem' }}>
          <h4>{item.date} {item.time}</h4>
          <p>Patient: {item.patientId?.fullName || 'Patient'} | {item.type} | {item.status}</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="hm-btn hm-btn-outline" onClick={() => setStatus(item._id, 'confirmed')}>Confirm</button>
            <button className="hm-btn hm-btn-outline" onClick={() => setStatus(item._id, 'completed')}>Complete</button>
            <button className="hm-btn hm-btn-outline" onClick={() => setStatus(item._id, 'cancelled')}>Cancel</button>
          </div>
        </article>
      ))}
    </main>
  );
}
