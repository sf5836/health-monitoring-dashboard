import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getDoctorProfile,
  updateDoctorProfile,
  type DoctorProfile
} from '../../services/doctorPortalService';

type ProfilePhotoUpload = {
  fileName: string;
  contentType: string;
  dataBase64: string;
  previewUrl: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

export default function DoctorProfilePage() {
  const location = useLocation();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hospital, setHospital] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profilePhotoUpload, setProfilePhotoUpload] = useState<ProfilePhotoUpload | null>(null);

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
        setProfilePhotoUrl(data.profilePhotoUrl || '');
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

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, loading]);

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataBase64 = await fileToBase64(file);
      setProfilePhotoUpload({
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        dataBase64,
        previewUrl: dataBase64
      });
      setProfilePhotoUrl(dataBase64);
      setSuccess('Profile photo ready to upload. Save to apply.');
      setError('');
    } catch {
      setError('Unable to read the selected image.');
    } finally {
      event.target.value = '';
    }
  }

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
        availability: availability.trim() || undefined,
        profilePhoto: profilePhotoUpload
          ? {
              fileName: profilePhotoUpload.fileName,
              contentType: profilePhotoUpload.contentType,
              dataBase64: profilePhotoUpload.dataBase64
            }
          : undefined
      });

      setProfile(next);
      setProfilePhotoUrl(next.profilePhotoUrl || profilePhotoUpload?.previewUrl || profilePhotoUrl);
      setProfilePhotoUpload(null);
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
          <div className="doctor-form-span-2 doctor-profile-photo-row" id="photo">
            <label className="doctor-profile-photo is-editable" htmlFor="doctor-profile-photo">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Doctor profile" />
              ) : (
                <span>{(fullName || 'DR').slice(0, 2).toUpperCase()}</span>
              )}
            </label>
            <div className="doctor-profile-photo-actions">
              <h3>Profile photo</h3>
              <p>Click the photo to upload a professional headshot (PNG, JPG, WEBP).</p>
              <input
                id="doctor-profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleProfilePhotoChange}
                hidden
              />
            </div>
          </div>
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
          <label className="doctor-form-span-2" id="edit">
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
