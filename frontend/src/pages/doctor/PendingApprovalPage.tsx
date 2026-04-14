import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function PendingApprovalPage() {
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('Waiting for review');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    doctorService
      .getMyProfile()
      .then((data) => {
        const profile = (data as any).profile?.doctorProfile;
        setStatus(profile?.approvalStatus || 'pending');
        setNote(profile?.approvalNote || 'Waiting for review');
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load approval status');
      });
  }, []);

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Doctor Approval Status</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <section className="hm-card">
        <p>Status: <strong>{status}</strong></p>
        <p>Note: {note}</p>
        <Link className="hm-btn hm-btn-outline" to="/doctor/profile">Edit Profile</Link>
      </section>
    </main>
  );
}
