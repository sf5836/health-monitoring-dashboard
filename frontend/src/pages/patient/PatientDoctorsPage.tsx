import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import {
  createOrGetConversationWithUser,
  connectDoctor,
  disconnectDoctor,
  getConnectedDoctors,
  getDoctorDirectory,
  type ConnectedDoctor,
  type DoctorDirectoryResult
} from '../../services/patientPortalService';

const SPECIALIZATIONS = ['All', 'Cardiology', 'Neurology', 'Diabetes', 'Eye', 'General'];

function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function PatientDoctorsPage() {
  const navigate = useNavigate();
  const [connectedDoctors, setConnectedDoctors] = useState<ConnectedDoctor[]>([]);
  const [directory, setDirectory] = useState<DoctorDirectoryResult | null>(null);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyDoctorId, setBusyDoctorId] = useState('');
  const [error, setError] = useState('');

  const connectedIdSet = useMemo(
    () => new Set(connectedDoctors.map((doctor) => doctor.doctorUserId)),
    [connectedDoctors]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadConnectedDoctors() {
      try {
        const doctors = await getConnectedDoctors();
        if (cancelled) return;
        setConnectedDoctors(doctors);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load connected doctors.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConnectedDoctors();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDirectoryOpen) return;
    let cancelled = false;

    async function loadDirectory() {
      try {
        const result = await getDoctorDirectory({ page, search, specialization });
        if (cancelled) return;
        setDirectory(result);
      } catch {
        if (cancelled) return;
        setDirectory({
          doctors: [],
          pagination: {
            page: 1,
            totalPages: 1,
            total: 0
          }
        });
      }
    }

    loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [isDirectoryOpen, page, search, specialization]);

  async function refreshConnectedDoctors() {
    const doctors = await getConnectedDoctors();
    setConnectedDoctors(doctors);
  }

  async function handleConnect(doctorUserId: string) {
    try {
      setBusyDoctorId(doctorUserId);
      await connectDoctor(doctorUserId);
      await refreshConnectedDoctors();
    } catch {
      setError('Unable to connect this doctor right now.');
    } finally {
      setBusyDoctorId('');
    }
  }

  async function handleDisconnect(doctorUserId: string) {
    const shouldDisconnect = window.confirm('Disconnect this doctor from your care team?');
    if (!shouldDisconnect) return;

    try {
      setBusyDoctorId(doctorUserId);
      await disconnectDoctor(doctorUserId);
      setConnectedDoctors((previous) =>
        previous.filter((doctor) => doctor.doctorUserId !== doctorUserId)
      );
    } catch {
      setError('Unable to disconnect this doctor right now.');
    } finally {
      setBusyDoctorId('');
    }
  }

  async function handleStartMessage(doctorUserId: string) {
    try {
      setBusyDoctorId(doctorUserId);
      const conversation = await createOrGetConversationWithUser(doctorUserId);
      navigate(`${ROUTE_PATHS.patient.messages}?conversationId=${conversation.id}`);
    } catch {
      setError('Unable to open chat with this doctor right now.');
    } finally {
      setBusyDoctorId('');
    }
  }

  return (
    <section className="patient-page patient-doctors-page">
      <header className="patient-page-head">
        <div>
          <h2>My Doctors</h2>
          <p>Manage your healthcare team</p>
        </div>
        <button type="button" className="patient-primary-button" onClick={() => setIsDirectoryOpen(true)}>
          Find and Connect New Doctor
        </button>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <article className="patient-card">
        <h3>Connected Doctors ({connectedDoctors.length})</h3>

        {loading ? (
          <p className="patient-page-status">Loading connected doctors...</p>
        ) : connectedDoctors.length === 0 ? (
          <div className="patient-empty-state patient-doctors-empty-state">
            <h4>No doctors connected yet</h4>
            <p>Connect with a verified specialist to start getting personalized care</p>
            <button type="button" className="patient-primary-button" onClick={() => setIsDirectoryOpen(true)}>
              Find a Doctor
            </button>
          </div>
        ) : (
          <ul className="patient-list patient-doctors-connected-list">
            {connectedDoctors.map((doctor) => (
              <li key={doctor.doctorUserId} className="patient-list-item patient-doctor-row">
                <div className="patient-doctor-profile">
                  <div className="patient-doctor-avatar" aria-hidden="true">
                    {initials(doctor.fullName)}
                    <span className="patient-doctor-online-dot" />
                  </div>

                  <div>
                    <p className="patient-doctor-name">{doctor.fullName}</p>
                    <p className="patient-doctor-meta">{doctor.specialization || 'Specialist'}</p>
                    <small>
                      {doctor.hospital || 'Healthcare Network'}
                      {doctor.experienceYears ? ` | ${doctor.experienceYears} years` : ''}
                    </small>
                  </div>
                </div>

                <div className="patient-inline-actions patient-doctor-actions">
                  <button
                    type="button"
                    className="patient-secondary-button"
                    onClick={() => handleStartMessage(doctor.doctorUserId)}
                    disabled={busyDoctorId === doctor.doctorUserId}
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    className="patient-secondary-button"
                    onClick={() => navigate(ROUTE_PATHS.patient.appointments)}
                  >
                    Book Appointment
                  </button>
                  <button
                    type="button"
                    className="patient-link-button danger"
                    onClick={() => handleDisconnect(doctor.doctorUserId)}
                    disabled={busyDoctorId === doctor.doctorUserId}
                  >
                    Disconnect
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      {isDirectoryOpen ? (
        <section className="patient-modal-backdrop" role="dialog" aria-modal="true">
          <article className="patient-modal patient-doctor-modal patient-doctor-discovery-modal">
            <header className="patient-card-head">
              <h3>Find Your Doctor</h3>
              <button type="button" className="patient-link-button" onClick={() => setIsDirectoryOpen(false)}>
                Close
              </button>
            </header>

            <div className="patient-inline-filters">
              <input
                type="text"
                placeholder="Search by name or specialization"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
              />
            </div>

            <div className="patient-doctor-filter-pills">
              {SPECIALIZATIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`patient-tab-pill ${item === specialization ? 'is-active' : ''}`}
                  onClick={() => {
                    setPage(1);
                    setSpecialization(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            {!directory || directory.doctors.length === 0 ? (
              <p className="patient-empty-state">No doctors found for this filter.</p>
            ) : (
              <div className="patient-grid patient-directory-grid">
                {directory.doctors.map((doctor) => {
                  const alreadyConnected = connectedIdSet.has(doctor.doctorUserId);
                  return (
                    <article key={doctor.doctorUserId} className="patient-card patient-directory-card">
                      <div className="patient-doctor-avatar" aria-hidden="true">
                        {initials(doctor.fullName)}
                      </div>
                      <h4>{doctor.fullName}</h4>
                      <p>{doctor.specialization || 'Specialist'}</p>
                      <small>
                        {doctor.experienceYears || 0} years exp
                        {doctor.fee ? ` | PKR ${doctor.fee.toLocaleString()}` : ''}
                      </small>
                      <small>Rating: {doctor.rating ? doctor.rating.toFixed(1) : 'New'}</small>
                      <button
                        type="button"
                        className={alreadyConnected ? 'patient-secondary-button' : 'patient-primary-button'}
                        disabled={alreadyConnected || busyDoctorId === doctor.doctorUserId}
                        onClick={() => handleConnect(doctor.doctorUserId)}
                      >
                        {alreadyConnected ? 'Connected' : 'Connect'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="patient-pagination-row">
              <button
                type="button"
                className="patient-secondary-button"
                disabled={page <= 1}
                onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              >
                Previous
              </button>
              <p>
                Page {directory?.pagination.page || 1} of {directory?.pagination.totalPages || 1}
              </p>
              <button
                type="button"
                className="patient-secondary-button"
                disabled={page >= (directory?.pagination.totalPages || 1)}
                onClick={() =>
                  setPage((previous) => Math.min(previous + 1, directory?.pagination.totalPages || 1))
                }
              >
                Next
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </section>
  );
}
