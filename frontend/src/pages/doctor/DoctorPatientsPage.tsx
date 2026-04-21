import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrGetConversationWithUser } from '../../services/patientPortalService';
import {
  getDoctorPatientDetail,
  getDoctorPatients,
  type DoctorPatientDetail,
  type DoctorPatientSummary,
  type DoctorVitalRecord,
  type RiskLevel
} from '../../services/doctorPortalService';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { formatBloodPressure, formatDateTime, initials, riskClass, riskLabel } from './doctorUi';

type EnrichedPatient = DoctorPatientSummary & {
  riskLevel: RiskLevel;
  primaryConcern: string;
  lastVital?: DoctorVitalRecord;
};

const PAGE_SIZE = 15;

function sortPatients(value: EnrichedPatient[], sortBy: string): EnrichedPatient[] {
  const items = [...value];

  if (sortBy === 'name') {
    return items.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  if (sortBy === 'risk') {
    const weight = (risk: RiskLevel) => {
      if (risk === 'high') return 3;
      if (risk === 'medium') return 2;
      return 1;
    };

    return items.sort((a, b) => {
      const riskDelta = weight(b.riskLevel) - weight(a.riskLevel);
      if (riskDelta !== 0) return riskDelta;
      return a.fullName.localeCompare(b.fullName);
    });
  }

  return items.sort((a, b) => {
    const aTime = new Date(a.lastVital?.datetime || a.updatedAt || 0).getTime();
    const bTime = new Date(b.lastVital?.datetime || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
}

export default function DoctorPatientsPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<EnrichedPatient[]>([]);
  const [detailMap, setDetailMap] = useState<Record<string, DoctorPatientDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'risk'>('updated');
  const [page, setPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      try {
        const patientRows = await getDoctorPatients();

        if (cancelled) return;

        const detailResults = await Promise.allSettled(
          patientRows.map((patient) => getDoctorPatientDetail(patient.patientId))
        );

        if (cancelled) return;

        const details: Record<string, DoctorPatientDetail> = {};

        const enriched = patientRows.map((row, index) => {
          const detailResult = detailResults[index];
          const detail = detailResult.status === 'fulfilled' ? detailResult.value : undefined;
          if (detail) {
            details[row.patientId] = detail;
          }

          const lastVital = detail?.latestVitals[0];
          const primaryConcern =
            row.medicalHistory?.split(/[.;]/)[0]?.trim() ||
            lastVital?.riskReasons[0] ||
            row.allergies[0] ||
            'General monitoring';

          return {
            ...row,
            riskLevel: lastVital?.riskLevel || 'normal',
            primaryConcern,
            lastVital
          } satisfies EnrichedPatient;
        });

        setPatients(enriched);
        setDetailMap(details);
        setError('');

        if (enriched.length > 0) {
          setSelectedPatientId(enriched[0].patientId);
        }
      } catch {
        if (cancelled) return;
        setError('Unable to fetch doctor patient list right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    const byRisk =
      riskFilter === 'all' ? patients : patients.filter((patient) => patient.riskLevel === riskFilter);

    const bySearch = query
      ? byRisk.filter((patient) => {
          return (
            patient.fullName.toLowerCase().includes(query) ||
            patient.email?.toLowerCase().includes(query) ||
            patient.primaryConcern.toLowerCase().includes(query)
          );
        })
      : byRisk;

    return sortPatients(bySearch, sortBy);
  }, [patients, riskFilter, search, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, riskFilter, sortBy]);

  const pagedPatients = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [filteredPatients, page]);

  const totalPages = Math.max(Math.ceil(filteredPatients.length / PAGE_SIZE), 1);

  const selectedDetail = selectedPatientId ? detailMap[selectedPatientId] : undefined;
  const selectedPatient = selectedPatientId ? patients.find((item) => item.patientId === selectedPatientId) : undefined;

  async function onMessagePatient(patientId: string) {
    try {
      const conversation = await createOrGetConversationWithUser(patientId);
      navigate(`${ROUTE_PATHS.doctor.messages}?conversationId=${conversation.id}`);
    } catch {
      setError('Unable to open message thread for this patient.');
    }
  }

  if (loading) {
    return <p className="doctor-page-status">Loading patients...</p>;
  }

  return (
    <section className="doctor-page doctor-patient-list-page">
      <header className="doctor-page-head">
        <div>
          <h2>My Patients</h2>
          <p>{patients.length} patients assigned to you</p>
        </div>
        <div className="doctor-head-actions">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by patient name..."
          />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'updated' | 'name' | 'risk')}>
            <option value="updated">Last Updated</option>
            <option value="risk">Risk Priority</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </header>

      {error ? <p className="doctor-error-banner">{error}</p> : null}

      <section className="doctor-filter-row">
        <button
          type="button"
          className={`doctor-tab-pill ${riskFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setRiskFilter('all')}
        >
          All Patients
        </button>
        <button
          type="button"
          className={`doctor-tab-pill ${riskFilter === 'high' ? 'is-active' : ''}`}
          onClick={() => setRiskFilter('high')}
        >
          HIGH Risk
        </button>
        <button
          type="button"
          className={`doctor-tab-pill ${riskFilter === 'medium' ? 'is-active' : ''}`}
          onClick={() => setRiskFilter('medium')}
        >
          MEDIUM Risk
        </button>
        <button
          type="button"
          className={`doctor-tab-pill ${riskFilter === 'normal' ? 'is-active' : ''}`}
          onClick={() => setRiskFilter('normal')}
        >
          Normal
        </button>
      </section>

      <article className="doctor-card doctor-table-card">
        <div className="doctor-table-wrap">
          <table className="doctor-table doctor-patients-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Patient</th>
                <th>Age</th>
                <th>Primary Concern</th>
                <th>Last Vital</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <p className="doctor-empty-state">No patients match your filters.</p>
                  </td>
                </tr>
              ) : (
                pagedPatients.map((patient) => (
                  <tr
                    key={patient.patientId}
                    className={`doctor-patient-row risk-${patient.riskLevel}`}
                    onClick={() => setSelectedPatientId(patient.patientId)}
                  >
                    <td>
                      <div className="doctor-avatar-mini" aria-hidden="true">
                        {initials(patient.fullName)}
                      </div>
                    </td>
                    <td>
                      <p className="doctor-table-name">{patient.fullName}</p>
                      <small>{patient.email || 'No email available'}</small>
                    </td>
                    <td>{patient.age ?? '-'}</td>
                    <td>{patient.primaryConcern}</td>
                    <td>{formatDateTime(patient.lastVital?.datetime)}</td>
                    <td>
                      <span className={`doctor-risk-pill ${riskClass(patient.riskLevel)}`}>
                        {riskLabel(patient.riskLevel)}
                      </span>
                    </td>
                    <td>
                      <div className="doctor-inline-actions" onClick={(event) => event.stopPropagation()}>
                        <Link to={`/doctor/patients/${patient.patientId}`} className="doctor-secondary-button compact">
                          View Record
                        </Link>
                        <button
                          type="button"
                          className="doctor-icon-button"
                          onClick={() => onMessagePatient(patient.patientId)}
                          aria-label={`Message ${patient.fullName}`}
                        >
                          💬
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="doctor-pagination-row">
          <p>
            Showing {pagedPatients.length} of {filteredPatients.length}
          </p>
          <div className="doctor-inline-actions">
            <button
              type="button"
              className="doctor-secondary-button compact"
              onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="doctor-secondary-button compact"
              onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </article>

      {selectedPatient && selectedDetail ? (
        <aside className="doctor-quick-view-panel" aria-label="Patient quick view">
          <header>
            <div className="doctor-avatar-large" aria-hidden="true">
              {initials(selectedPatient.fullName)}
            </div>
            <div>
              <h3>{selectedPatient.fullName}</h3>
              <p>{selectedPatient.email}</p>
            </div>
          </header>

          <p className="doctor-quick-view-label">Latest vitals</p>
          <ul className="doctor-list compact">
            {selectedDetail.latestVitals.slice(0, 3).map((vital) => (
              <li key={vital.id} className="doctor-list-item">
                <div>
                  <p>{formatBloodPressure(vital.bloodPressure)} mmHg</p>
                  <small>{formatDateTime(vital.datetime)}</small>
                </div>
                <span className={`doctor-risk-pill ${riskClass(vital.riskLevel)}`}>
                  {riskLabel(vital.riskLevel)}
                </span>
              </li>
            ))}
          </ul>

          <div className="doctor-inline-actions">
            <Link to={`/doctor/patients/${selectedPatient.patientId}`} className="doctor-primary-button">
              Full Record
            </Link>
            <button
              type="button"
              className="doctor-secondary-button"
              onClick={() => onMessagePatient(selectedPatient.patientId)}
            >
              Send Message
            </button>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
