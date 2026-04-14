import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import patientService, { type ConnectedDoctor } from '../../services/patientService';
import publicService, { type PublicDoctor } from '../../services/publicService';

export default function MyDoctorsPage() {
  const session = authService.getSession();
  const [connectedDoctors, setConnectedDoctors] = useState<ConnectedDoctor[]>([]);
  const [publicDoctors, setPublicDoctors] = useState<PublicDoctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyDoctorId, setBusyDoctorId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [connected, publicList] = await Promise.all([
        patientService.getMyDoctors(),
        publicService.getPublicDoctors()
      ]);
      setConnectedDoctors(connected);
      setPublicDoctors(publicList);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load doctors');
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

  const connectedIds = useMemo(
    () => new Set(connectedDoctors.map((doctor) => doctor.userId._id)),
    [connectedDoctors]
  );

  const filteredPublicDoctors = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return publicDoctors;
    }
    return publicDoctors.filter((doctor) => {
      const haystack = `${doctor.userId?.fullName || ''} ${doctor.specialization || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [search, publicDoctors]);

  const handleConnect = async (doctorId: string) => {
    setBusyDoctorId(doctorId);
    setErrorMessage('');
    try {
      await patientService.connectDoctor(doctorId);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to connect doctor');
    } finally {
      setBusyDoctorId(null);
    }
  };

  const handleDisconnect = async (doctorId: string) => {
    setBusyDoctorId(doctorId);
    setErrorMessage('');
    try {
      await patientService.disconnectDoctor(doctorId);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to disconnect doctor');
    } finally {
      setBusyDoctorId(null);
    }
  };

  if (!session) {
    return (
      <section className="placeholder-page">
        <h2>My Doctors</h2>
        <p>Please login as a patient to manage your doctors.</p>
        <Link to="/login">Go to Login</Link>
      </section>
    );
  }

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <section className="hm-section-head">
        <h2>My Doctors</h2>
        <p>Connect with verified specialists and manage your care team</p>
      </section>

      <input
        type="search"
        placeholder="Search doctors by name or specialization"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ width: '100%', maxWidth: 520, marginBottom: '1rem' }}
      />

      {loading ? <p>Loading doctors...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      <section className="hm-grid-3" style={{ marginBottom: '1rem' }}>
        <article className="hm-card">
          <p className="hm-meta">Connected Doctors</p>
          <h3>{connectedDoctors.length}</h3>
        </article>
        <article className="hm-card">
          <p className="hm-meta">Available Specialists</p>
          <h3>{publicDoctors.length}</h3>
        </article>
        <article className="hm-card">
          <p className="hm-meta">Search Results</p>
          <h3>{filteredPublicDoctors.length}</h3>
        </article>
      </section>

      <section className="hm-grid-3">
        <article className="hm-card" style={{ gridColumn: 'span 1' }}>
          <h3>Connected</h3>
          {!connectedDoctors.length ? <p>No doctors connected yet.</p> : null}
          {connectedDoctors.map((doctor) => (
            <article key={doctor._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
              <strong>{doctor.userId.fullName}</strong>
              <p>{doctor.specialization || 'Specialist'}</p>
              <small>{doctor.hospital || 'Hospital not listed'}</small>
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="hm-btn hm-btn-outline"
                  onClick={() => handleDisconnect(doctor.userId._id)}
                  disabled={busyDoctorId === doctor.userId._id}
                >
                  {busyDoctorId === doctor.userId._id ? 'Working...' : 'Disconnect'}
                </button>
              </div>
            </article>
          ))}
        </article>

        <article className="hm-card" style={{ gridColumn: 'span 2' }}>
          <h3>Find and Connect</h3>
          {filteredPublicDoctors.map((doctor) => {
            const isConnected = connectedIds.has(doctor.userId._id);
            return (
              <article key={doctor._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
                <strong>{doctor.userId.fullName}</strong>
                <p>
                  {doctor.specialization || 'Specialist'} | {doctor.hospital || 'Hospital not listed'}
                </p>
                <small>Fee: PKR {doctor.fee ?? 0}</small>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.6rem' }}>
                  <Link className="hm-btn hm-btn-outline" to={`/doctors/${doctor.userId._id}`}>
                    View Profile
                  </Link>
                  <button
                    type="button"
                    className="hm-btn hm-btn-primary"
                    onClick={() => handleConnect(doctor.userId._id)}
                    disabled={isConnected || busyDoctorId === doctor.userId._id}
                  >
                    {isConnected ? 'Connected' : busyDoctorId === doctor.userId._id ? 'Working...' : 'Connect'}
                  </button>
                </div>
              </article>
            );
          })}
        </article>
      </section>
    </main>
  );
}
