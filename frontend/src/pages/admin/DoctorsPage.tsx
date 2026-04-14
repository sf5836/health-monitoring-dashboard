import { useEffect, useMemo, useState } from 'react';
import adminService, { type AdminDoctorRecord } from '../../services/adminService';
import { ApiError } from '../../services/apiClient';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctorRecord[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAll, setShowAll] = useState(false);

  const loadData = async () => {
    try {
      const data = showAll ? await adminService.getDoctors() : await adminService.getPendingDoctors();
      setDoctors(data);
      if (data.length > 0 && !selectedDoctorId) setSelectedDoctorId(data[0].userId?._id || '');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load doctors');
    }
  };

  useEffect(() => {
    loadData();
  }, [showAll]);

  const selected = useMemo(
    () => doctors.find((d) => d.userId?._id === selectedDoctorId) || null,
    [doctors, selectedDoctorId]
  );

  const moderate = async (action: 'approve' | 'reject' | 'suspend') => {
    if (!selectedDoctorId) return;
    try {
      if (action === 'approve') await adminService.approveDoctor(selectedDoctorId, note);
      if (action === 'reject') await adminService.rejectDoctor(selectedDoctorId, note);
      if (action === 'suspend') await adminService.suspendDoctor(selectedDoctorId, note);
      setNote('');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : `Failed to ${action} doctor`);
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Admin Doctors</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Show all doctors
      </label>
      <section className="hm-grid-3" style={{ marginTop: '1rem' }}>
        <aside className="hm-card" style={{ gridColumn: 'span 1' }}>
          {doctors.map((d) => (
            <button key={d._id} className="hm-btn hm-btn-outline hm-btn-block" onClick={() => setSelectedDoctorId(d.userId?._id || '')}>
              {d.userId?.fullName || 'Doctor'} ({d.approvalStatus})
            </button>
          ))}
        </aside>
        <section className="hm-card" style={{ gridColumn: 'span 2' }}>
          {selected ? (
            <>
              <h3>{selected.userId?.fullName || 'Doctor'}</h3>
              <p>{selected.userId?.email}</p>
              <p>{selected.specialization || 'Specialization not set'} | {selected.hospital || 'Hospital not set'}</p>
              <form style={{ display: 'grid', gap: '0.6rem' }}>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Moderation note" />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="hm-btn hm-btn-primary" onClick={() => moderate('approve')}>Approve</button>
                  <button className="hm-btn hm-btn-outline" onClick={() => moderate('reject')}>Reject</button>
                  <button className="hm-btn hm-btn-outline" onClick={() => moderate('suspend')}>Suspend</button>
                </div>
              </form>
            </>
          ) : (
            <p>Select a doctor to moderate.</p>
          )}
        </section>
      </section>
    </main>
  );
}
