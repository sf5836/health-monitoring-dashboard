import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function PatientDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    if (!id) return;
    setErrorMessage('');
    try {
      const [d, t] = await Promise.all([
        doctorService.getMyPatientDetail(id),
        doctorService.getMyPatientTrends(id, 30)
      ]);
      setDetail((d as any).patient);
      setTrends(t);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load patient detail');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const saveNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !note.trim()) return;
    try {
      await doctorService.addPatientNote(id, note.trim());
      setNote('');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to save note');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Patient Detail</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <section className="hm-grid-3">
        <article className="hm-card" style={{ gridColumn: 'span 2' }}>
          <h3>{detail?.user?.fullName || 'Patient'}</h3>
          <p>{detail?.user?.email}</p>
          <p>Recent Vitals: {detail?.latestVitals?.length || 0}</p>
          {(detail?.latestVitals || []).map((v: any) => (
            <p key={v._id}>{new Date(v.datetime).toLocaleString()} | risk: {v.riskLevel}</p>
          ))}
        </article>
        <article className="hm-card">
          <h3>Trends (30d)</h3>
          <p>Records: {trends?.totalRecords || 0}</p>
        </article>
      </section>
      <section className="hm-card" style={{ marginTop: '1rem' }}>
        <h3>Doctor Notes</h3>
        <ul>{(detail?.doctorNotes || []).map((n: any) => <li key={n._id || n.createdAt}>{n.note}</li>)}</ul>
        <form onSubmit={saveNote} style={{ display: 'flex', gap: '0.6rem' }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note" style={{ flex: 1 }} />
          <button className="hm-btn hm-btn-primary" type="submit">Save</button>
        </form>
      </section>
    </main>
  );
}
