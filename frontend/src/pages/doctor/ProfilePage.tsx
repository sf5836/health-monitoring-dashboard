import { FormEvent, useEffect, useState } from 'react';
import doctorService from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function ProfilePage() {
  const [form, setForm] = useState({ fullName: '', phone: '', specialization: '', hospital: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    doctorService
      .getMyProfile()
      .then((data) => {
        const profile = (data as any).profile;
        setForm({
          fullName: profile?.user?.fullName || '',
          phone: profile?.user?.phone || '',
          specialization: profile?.doctorProfile?.specialization || '',
          hospital: profile?.doctorProfile?.hospital || '',
          bio: profile?.doctorProfile?.bio || ''
        });
      })
      .catch((error: unknown) => setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await doctorService.updateMyProfile(form);
      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to update profile');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Doctor Profile</h2>
      {loading ? <p>Loading profile...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}
      <form onSubmit={handleSubmit} className="hm-card" style={{ display: 'grid', gap: '0.7rem', maxWidth: 700 }}>
        <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full name" />
        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
        <input value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} placeholder="Specialization" />
        <input value={form.hospital} onChange={(e) => setForm((p) => ({ ...p, hospital: e.target.value }))} placeholder="Hospital" />
        <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Bio" rows={4} />
        <button className="hm-btn hm-btn-primary" type="submit">Save</button>
      </form>
    </main>
  );
}
