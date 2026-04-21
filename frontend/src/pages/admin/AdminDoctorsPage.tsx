import { useEffect, useMemo, useState } from 'react';
import {
  approveAdminDoctor,
  deleteAdminDoctor,
  getAdminDoctors,
  rejectAdminDoctor,
  suspendAdminDoctor,
  updateAdminDoctor,
  type AdminDoctor
} from '../../services/adminPortalService';
import { formatDate, formatRelativeTime, initials, statusClass } from './adminUi';

type DoctorTab = 'pending' | 'all' | 'suspended';

type DoctorEditForm = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  hospital: string;
  licenseNumber: string;
  experienceYears: string;
  fee: string;
  bio: string;
  availability: string;
  qualifications: string;
  isActive: boolean;
  approvalStatus: AdminDoctor['approvalStatus'];
};

function maskLicense(value?: string): string {
  if (!value) return 'N/A';
  const cleaned = String(value);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 5)}****${cleaned.slice(-4)}`;
}

function createDoctorEditForm(doctor: AdminDoctor): DoctorEditForm {
  return {
    fullName: doctor.fullName || '',
    email: doctor.email || '',
    phone: doctor.phone || '',
    specialization: doctor.specialization || '',
    hospital: doctor.hospital || '',
    licenseNumber: doctor.licenseNumber || '',
    experienceYears: String(doctor.experienceYears ?? ''),
    fee: String(doctor.fee ?? ''),
    bio: doctor.bio || '',
    availability: doctor.availability || '',
    qualifications: (doctor.qualifications || []).join(', '),
    isActive: Boolean(doctor.isActive),
    approvalStatus: doctor.approvalStatus
  };
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [activeTab, setActiveTab] = useState<DoctorTab>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<AdminDoctor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<DoctorEditForm | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const data = await getAdminDoctors();
        if (cancelled) return;
        setDoctors(data);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load doctor management data.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.approvalStatus === 'pending'),
    [doctors]
  );
  const suspendedDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.approvalStatus === 'suspended'),
    [doctors]
  );

  const visibleDoctors = useMemo(() => {
    const source =
      activeTab === 'pending' ? pendingDoctors : activeTab === 'suspended' ? suspendedDoctors : doctors;

    const query = search.trim().toLowerCase();
    if (!query) return source;

    return source.filter((doctor) => {
      return (
        doctor.fullName.toLowerCase().includes(query) ||
        (doctor.specialization || '').toLowerCase().includes(query) ||
        (doctor.hospital || '').toLowerCase().includes(query)
      );
    });
  }, [activeTab, doctors, pendingDoctors, search, suspendedDoctors]);

  function updateDoctorState(doctorId: string, patch: Partial<AdminDoctor>) {
    setDoctors((previous) => previous.map((doctor) => (doctor.userId === doctorId ? { ...doctor, ...patch } : doctor)));
  }

  function openDoctorModal(doctor: AdminDoctor, edit = false) {
    setSelectedDoctor(doctor);
    setIsEditMode(edit);
    setEditForm(createDoctorEditForm(doctor));
    setIsRejectMode(false);
    setRejectReason('');
  }

  async function onApprove(doctor: AdminDoctor) {
    try {
      await approveAdminDoctor(doctor.userId, 'Approved by admin');
      updateDoctorState(doctor.userId, {
        approvalStatus: 'approved',
        approvalNote: 'Approved by admin',
        approvedAt: new Date().toISOString(),
        isActive: true
      });
      setSelectedDoctor(null);
      setError('');
    } catch {
      setError('Unable to approve this doctor right now.');
    }
  }

  async function onReject(doctor: AdminDoctor, reason?: string) {
    try {
      await rejectAdminDoctor(doctor.userId, reason || 'Rejected by admin');
      updateDoctorState(doctor.userId, {
        approvalStatus: 'rejected',
        approvalNote: reason || 'Rejected by admin',
        approvedAt: new Date().toISOString(),
        isActive: false
      });
      setSelectedDoctor(null);
      setRejectReason('');
      setIsRejectMode(false);
      setError('');
    } catch {
      setError('Unable to reject this doctor right now.');
    }
  }

  async function onSuspend(doctor: AdminDoctor) {
    try {
      await suspendAdminDoctor(doctor.userId, 'Suspended by admin');
      updateDoctorState(doctor.userId, {
        approvalStatus: 'suspended',
        approvalNote: 'Suspended by admin',
        approvedAt: new Date().toISOString(),
        isActive: false
      });
      setError('');
    } catch {
      setError('Unable to suspend this doctor right now.');
    }
  }

  async function onDelete(doctor: AdminDoctor) {
    if (!window.confirm(`Delete ${doctor.fullName}? This cannot be undone.`)) return;

    try {
      await deleteAdminDoctor(doctor.userId);
      setDoctors((previous) => previous.filter((item) => item.userId !== doctor.userId));
      setBulkSelection((previous) => previous.filter((id) => id !== doctor.userId));
      setError('');
    } catch {
      setError('Unable to delete this doctor right now.');
    }
  }

  async function onSaveDoctorChanges() {
    if (!selectedDoctor || !editForm) return;

    try {
      setSavingEdit(true);

      const updatedDoctor = await updateAdminDoctor(selectedDoctor.userId, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        specialization: editForm.specialization.trim(),
        hospital: editForm.hospital.trim(),
        licenseNumber: editForm.licenseNumber.trim(),
        experienceYears: editForm.experienceYears.trim() ? Number(editForm.experienceYears) : undefined,
        fee: editForm.fee.trim() ? Number(editForm.fee) : undefined,
        bio: editForm.bio.trim(),
        availability: editForm.availability.trim(),
        qualifications: editForm.qualifications
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        isActive: editForm.isActive,
        approvalStatus: editForm.approvalStatus
      });

      setDoctors((previous) =>
        previous.map((doctor) => (doctor.userId === selectedDoctor.userId ? updatedDoctor : doctor))
      );
      setSelectedDoctor(updatedDoctor);
      setEditForm(createDoctorEditForm(updatedDoctor));
      setIsEditMode(false);
      setError('');
    } catch {
      setError('Unable to save doctor updates right now.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function suspendSelected() {
    try {
      await Promise.all(bulkSelection.map((doctorId) => suspendAdminDoctor(doctorId, 'Bulk suspended by admin')));
      setDoctors((previous) =>
        previous.map((doctor) =>
          bulkSelection.includes(doctor.userId)
            ? { ...doctor, approvalStatus: 'suspended', approvalNote: 'Bulk suspended by admin', isActive: false }
            : doctor
        )
      );
      setBulkSelection([]);
    } catch {
      setError('Unable to suspend one or more selected doctors.');
    }
  }

  async function deleteSelected() {
    if (!window.confirm(`Delete ${bulkSelection.length} selected doctors?`)) return;

    try {
      await Promise.all(bulkSelection.map((doctorId) => deleteAdminDoctor(doctorId)));
      setDoctors((previous) => previous.filter((doctor) => !bulkSelection.includes(doctor.userId)));
      setBulkSelection([]);
    } catch {
      setError('Unable to delete one or more selected doctors.');
    }
  }

  if (loading) {
    return <p className="admin-page-status">Loading doctor management...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>Doctor Management</h2>
          <p>
            {doctors.filter((item) => item.approvalStatus === 'approved').length} approved | {pendingDoctors.length}{' '}
            pending | {suspendedDoctors.length} suspended
          </p>
        </div>
        <button type="button" className="admin-secondary-button" onClick={() => window.print()}>
          Export CSV
        </button>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <section className="admin-tab-row">
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'pending' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({pendingDoctors.length})
        </button>
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Doctors ({doctors.length})
        </button>
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'suspended' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('suspended')}
        >
          Suspended ({suspendedDoctors.length})
        </button>
      </section>

      {activeTab === 'pending' ? (
        <>
          <article className="admin-info-banner warning">
            {pendingDoctors.length} doctor applications require your review.
          </article>

          <section className="admin-pending-doctor-grid">
            {pendingDoctors.length === 0 ? (
              <p className="admin-empty-state">No pending doctor applications.</p>
            ) : (
              pendingDoctors.map((doctor) => (
                <article key={doctor.id} className="admin-pending-doctor-card">
                  <div className="admin-avatar large" aria-hidden="true">
                    {initials(doctor.fullName)}
                  </div>

                  <div>
                    <p className="admin-card-name">{doctor.fullName}</p>
                    <p className="admin-specialty-pill">{doctor.specialization || 'Specialist'}</p>
                    <small>License: {maskLicense(doctor.licenseNumber)}</small>
                    <small>
                      {doctor.hospital || 'Hospital not set'} · Applied {formatRelativeTime(doctor.createdAt)}
                    </small>
                  </div>

                  <div className="admin-inline-actions end">
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={() => openDoctorModal(doctor)}
                    >
                      Review Application
                    </button>
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => onReject(doctor, 'Rejected by admin quick action')}
                    >
                      Quick Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      ) : (
        <article className="admin-card">
          <div className="admin-table-toolbar">
            <input
              type="search"
              placeholder="Search doctor name, specialization, hospital"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="admin-inline-actions">
              <button
                type="button"
                className="admin-secondary-button compact"
                onClick={suspendSelected}
                disabled={bulkSelection.length === 0}
              >
                Suspend selected
              </button>
              <button
                type="button"
                className="admin-danger-button compact"
                onClick={deleteSelected}
                disabled={bulkSelection.length === 0}
              >
                Delete selected
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={visibleDoctors.length > 0 && bulkSelection.length === visibleDoctors.length}
                      onChange={(event) =>
                        setBulkSelection(event.target.checked ? visibleDoctors.map((doctor) => doctor.userId) : [])
                      }
                    />
                  </th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Patients</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <p className="admin-empty-state">No doctors found.</p>
                    </td>
                  </tr>
                ) : (
                  visibleDoctors.map((doctor) => (
                    <tr key={doctor.id} className={doctor.approvalStatus === 'suspended' ? 'is-muted' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={bulkSelection.includes(doctor.userId)}
                          onChange={(event) => {
                            setBulkSelection((previous) => {
                              if (event.target.checked) {
                                return [...previous, doctor.userId];
                              }
                              return previous.filter((item) => item !== doctor.userId);
                            });
                          }}
                        />
                      </td>
                      <td>
                        <div className="admin-avatar">{initials(doctor.fullName)}</div>
                      </td>
                      <td>
                        <p className="admin-table-name">{doctor.fullName}</p>
                        <small>{doctor.email}</small>
                      </td>
                      <td>{doctor.specialization || '-'}</td>
                      <td>{doctor.reviewsCount || 0}</td>
                      <td>
                        <span className={`admin-status-badge ${statusClass(doctor.approvalStatus)}`}>
                          {doctor.approvalStatus}
                        </span>
                      </td>
                      <td>{formatDate(doctor.createdAt)}</td>
                      <td>
                        <div className="admin-inline-actions">
                          <button
                            type="button"
                            className="admin-icon-button"
                            title="View"
                            onClick={() => openDoctorModal(doctor)}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button"
                            title="Edit"
                            onClick={() => openDoctorModal(doctor, true)}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button"
                            title="Suspend"
                            onClick={() => onSuspend(doctor)}
                          >
                            ⏸️
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button danger"
                            title="Delete"
                            onClick={() => onDelete(doctor)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {selectedDoctor ? (
        <section className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedDoctor(null)}>
          <article className="admin-modal doctor-review-modal" onClick={(event) => event.stopPropagation()}>
            <header className="admin-card-head">
              <h3>{isEditMode ? 'Edit Doctor Profile' : 'Review Doctor Application'}</h3>
              <button type="button" className="admin-link-button" onClick={() => setSelectedDoctor(null)}>
                Close
              </button>
            </header>

            <div className="admin-review-grid">
              <section className="admin-card no-shadow">
                <div className="admin-inline-actions">
                  <div className="admin-avatar large">{initials(selectedDoctor.fullName)}</div>
                  <div>
                    <p className="admin-card-name">{selectedDoctor.fullName}</p>
                    <p>{selectedDoctor.specialization || 'Specialist'}</p>
                    <small>{selectedDoctor.email}</small>
                  </div>
                </div>

                {isEditMode && editForm ? (
                  <div className="admin-form-grid">
                    <label>
                      Full Name
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, fullName: event.target.value } : previous))
                        }
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, email: event.target.value } : previous))
                        }
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, phone: event.target.value } : previous))
                        }
                      />
                    </label>
                    <label>
                      Specialization
                      <input
                        type="text"
                        value={editForm.specialization}
                        onChange={(event) =>
                          setEditForm((previous) =>
                            previous ? { ...previous, specialization: event.target.value } : previous
                          )
                        }
                      />
                    </label>
                    <label>
                      Hospital
                      <input
                        type="text"
                        value={editForm.hospital}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, hospital: event.target.value } : previous))
                        }
                      />
                    </label>
                    <label>
                      License Number
                      <input
                        type="text"
                        value={editForm.licenseNumber}
                        onChange={(event) =>
                          setEditForm((previous) =>
                            previous ? { ...previous, licenseNumber: event.target.value } : previous
                          )
                        }
                      />
                    </label>
                    <label>
                      Experience Years
                      <input
                        type="number"
                        min={0}
                        value={editForm.experienceYears}
                        onChange={(event) =>
                          setEditForm((previous) =>
                            previous ? { ...previous, experienceYears: event.target.value } : previous
                          )
                        }
                      />
                    </label>
                    <label>
                      Consultation Fee (PKR)
                      <input
                        type="number"
                        min={0}
                        value={editForm.fee}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, fee: event.target.value } : previous))
                        }
                      />
                    </label>
                    <label>
                      Availability
                      <input
                        type="text"
                        value={editForm.availability}
                        onChange={(event) =>
                          setEditForm((previous) =>
                            previous ? { ...previous, availability: event.target.value } : previous
                          )
                        }
                      />
                    </label>
                    <label>
                      Approval Status
                      <select
                        value={editForm.approvalStatus}
                        onChange={(event) =>
                          setEditForm((previous) =>
                            previous
                              ? {
                                  ...previous,
                                  approvalStatus: event.target.value as DoctorEditForm['approvalStatus']
                                }
                              : previous
                          )
                        }
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </label>
                    <label>
                      Qualifications (comma separated)
                      <input
                        type="text"
                        value={editForm.qualifications}
                        onChange={(event) =>
                          setEditForm((previous) =>
                            previous ? { ...previous, qualifications: event.target.value } : previous
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Bio</span>
                      <textarea
                        rows={3}
                        value={editForm.bio}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, bio: event.target.value } : previous))
                        }
                      />
                    </label>
                    <label className="admin-checkbox-row">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(event) =>
                          setEditForm((previous) => (previous ? { ...previous, isActive: event.target.checked } : previous))
                        }
                      />
                      Active User
                    </label>
                  </div>
                ) : (
                  <>
                    <ul className="admin-details-list">
                      <li>License: {selectedDoctor.licenseNumber || '-'}</li>
                      <li>Hospital: {selectedDoctor.hospital || '-'}</li>
                      <li>Experience: {selectedDoctor.experienceYears || 0} years</li>
                      <li>Consultation Fee: {selectedDoctor.fee ? `PKR ${selectedDoctor.fee}` : '-'}</li>
                      <li>Availability: {selectedDoctor.availability || '-'}</li>
                      <li>Applied on: {formatDate(selectedDoctor.createdAt)}</li>
                    </ul>

                    {selectedDoctor.availabilitySchedule.length > 0 ? (
                      <div className="admin-tag-list">
                        {selectedDoctor.availabilitySchedule.map((slot, index) => (
                          <span key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}>
                            {slot.day}: {slot.startTime}-{slot.endTime}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p>{selectedDoctor.bio || 'No bio submitted yet.'}</p>

                    <div className="admin-tag-list">
                      {(selectedDoctor.qualifications || []).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="admin-card no-shadow">
                <h4>Legal Documents</h4>
                {selectedDoctor.legalDocuments.length === 0 ? (
                  <p className="admin-empty-state">No legal documents uploaded.</p>
                ) : (
                  <ul className="admin-details-list">
                    {selectedDoctor.legalDocuments.map((document, index) => (
                      <li key={`${document.fileUrl}-${index}`}>
                        <a href={document.fileUrl} target="_blank" rel="noreferrer">
                          {document.label || document.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <footer className="admin-modal-footer">
              {isEditMode ? (
                <div className="admin-inline-actions end">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => {
                      if (selectedDoctor) {
                        setEditForm(createDoctorEditForm(selectedDoctor));
                      }
                      setIsEditMode(false);
                    }}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-primary-button large"
                    onClick={onSaveDoctorChanges}
                    disabled={savingEdit}
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : isRejectMode ? (
                <div className="admin-reject-box">
                  <textarea
                    rows={3}
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() => onReject(selectedDoctor, rejectReason || 'Rejected by admin')}
                  >
                    Send Rejection
                  </button>
                </div>
              ) : (
                <div className="admin-inline-actions end">
                  <button type="button" className="admin-secondary-button" onClick={() => setIsEditMode(true)}>
                    Edit Profile
                  </button>
                  <button type="button" className="admin-danger-button" onClick={() => setIsRejectMode(true)}>
                    ✗ Reject
                  </button>
                  <button type="button" className="admin-primary-button large" onClick={() => onApprove(selectedDoctor)}>
                    ✓ Approve Doctor
                  </button>
                </div>
              )}
            </footer>
          </article>
        </section>
      ) : null}
    </section>
  );
}
