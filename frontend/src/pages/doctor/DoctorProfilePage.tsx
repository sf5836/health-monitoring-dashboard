import { type FormEvent, useEffect, useState } from 'react';
import {
  getDoctorProfile,
  updateDoctorProfile,
  type DoctorProfile
} from '../../services/doctorPortalService';

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hospital, setHospital] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await getDoctorProfile();

        if (cancelled) return;

        setProfile(data);
        setFullName(data.user.fullName || '');
        setPhone(data.user.phone || '');
        setSpecialization(data.specialization || '');
        setExperienceYears(data.experienceYears !== undefined ? String(data.experienceYears) : '');
        setHospital(data.hospital || '');
        setFee(data.fee !== undefined ? String(data.fee) : '');
        setBio(data.bio || '');
        setAvailability(data.availability || '');
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load doctor profile.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      const next = await updateDoctorProfile({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        specialization: specialization.trim() || undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        hospital: hospital.trim() || undefined,
        fee: fee ? Number(fee) : undefined,
        bio: bio.trim() || undefined,
        availability: availability.trim() || undefined
      });

      setProfile(next);
      setSuccess('Profile updated successfully.');
      setError('');
    } catch {
      setError('Unable to update profile right now.');
      setSuccess('');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="doctor-page-status">Loading profile...</p>;
  }

  return (
    <section className="doctor-page">
      <header className="doctor-page-head">
        <div>
          <h2>Profile</h2>
          <p>Manage your doctor account information</p>
        </div>
      </header>

      {error ? <p className="doctor-error-banner">{error}</p> : null}
      {success ? <p className="doctor-success-banner">{success}</p> : null}

      <article className="doctor-card">
        <form className="doctor-form-grid" onSubmit={onSubmit}>
          <label>
            Full Name
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label>
            Phone
            <input type="text" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            Specialization
            <input type="text" value={specialization} onChange={(event) => setSpecialization(event.target.value)} />
          </label>
          <label>
            Experience Years
            <input
              type="number"
              min="0"
              value={experienceYears}
              onChange={(event) => setExperienceYears(event.target.value)}
            />
          </label>
          <label>
            Hospital
            <input type="text" value={hospital} onChange={(event) => setHospital(event.target.value)} />
          </label>
          <label>
            Consultation Fee
            <input type="number" min="0" value={fee} onChange={(event) => setFee(event.target.value)} />
          </label>
          <label className="doctor-form-span-2">
            Bio
            <textarea rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
          </label>
          <label className="doctor-form-span-2">
            Availability
            <input
              type="text"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              placeholder="Mon-Fri, 9:00 AM - 5:00 PM"
            />
          </label>
          <div className="doctor-form-span-2">
            <button type="submit" className="doctor-primary-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {profile?.approvalStatus ? (
          <p className="doctor-micro-copy">Account status: {profile.approvalStatus}</p>
        ) : null}
      </article>
    </section>
  );
}
