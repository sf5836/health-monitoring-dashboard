import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createPatientVital,
  deletePatientVital,
  getPatientVitals,
  updatePatientVital,
  type PortalVitalRecord,
  type VitalCreateInput
} from '../../services/patientPortalService';
import {
  formatBloodPressure,
  formatDateTime,
  fromLocalDatetimeInput,
  riskClass,
  riskLabel,
  toLocalDatetimeInput
} from './patientUi';

type VitalFormState = {
  datetime: string;
  systolic: string;
  diastolic: string;
  heartRate: string;
  spo2: string;
  temperatureC: string;
  glucoseValue: string;
  glucoseMode: 'fasting' | 'post_meal' | 'random';
  weightKg: string;
  notes: string;
};

type SortKey =
  | 'datetime'
  | 'bloodPressure'
  | 'heartRate'
  | 'spo2'
  | 'glucose'
  | 'weightKg'
  | 'temperatureC'
  | 'risk';

type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 15;

const emptyFormState: VitalFormState = {
  datetime: toLocalDatetimeInput(new Date().toISOString()),
  systolic: '',
  diastolic: '',
  heartRate: '',
  spo2: '',
  temperatureC: '',
  glucoseValue: '',
  glucoseMode: 'fasting',
  weightKg: '',
  notes: ''
};

function numericValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPayload(state: VitalFormState): VitalCreateInput {
  const systolic = numericValue(state.systolic);
  const diastolic = numericValue(state.diastolic);
  const glucoseValue = numericValue(state.glucoseValue);

  return {
    datetime: fromLocalDatetimeInput(state.datetime),
    bloodPressure:
      systolic || diastolic
        ? {
            systolic,
            diastolic
          }
        : undefined,
    heartRate: numericValue(state.heartRate),
    spo2: numericValue(state.spo2),
    temperatureC: numericValue(state.temperatureC),
    glucose:
      glucoseValue !== undefined
        ? {
            value: glucoseValue,
            mode: state.glucoseMode
          }
        : undefined,
    weightKg: numericValue(state.weightKg),
    notes: state.notes.trim() || undefined
  };
}

function mapRecordToForm(record: PortalVitalRecord): VitalFormState {
  return {
    datetime: toLocalDatetimeInput(record.datetime),
    systolic: record.bloodPressure?.systolic ? String(record.bloodPressure.systolic) : '',
    diastolic: record.bloodPressure?.diastolic ? String(record.bloodPressure.diastolic) : '',
    heartRate: record.heartRate ? String(record.heartRate) : '',
    spo2: record.spo2 ? String(record.spo2) : '',
    temperatureC: record.temperatureC ? String(record.temperatureC) : '',
    glucoseValue: record.glucose?.value ? String(record.glucose.value) : '',
    glucoseMode: record.glucose?.mode || 'fasting',
    weightKg: record.weightKg ? String(record.weightKg) : '',
    notes: record.notes || ''
  };
}

function sortValue(record: PortalVitalRecord, key: SortKey): number {
  if (key === 'datetime') {
    return new Date(record.datetime).getTime();
  }

  if (key === 'bloodPressure') {
    const systolic = record.bloodPressure?.systolic || 0;
    const diastolic = record.bloodPressure?.diastolic || 0;
    return systolic * 1000 + diastolic;
  }

  if (key === 'heartRate') return record.heartRate || 0;
  if (key === 'spo2') return record.spo2 || 0;
  if (key === 'glucose') return record.glucose?.value || 0;
  if (key === 'weightKg') return record.weightKg || 0;
  if (key === 'temperatureC') return record.temperatureC || 0;

  const riskWeight: Record<PortalVitalRecord['riskLevel'], number> = {
    normal: 1,
    medium: 2,
    high: 3
  };

  return riskWeight[record.riskLevel] || 0;
}

export default function PatientVitalsPage() {
  const [vitals, setVitals] = useState<PortalVitalRecord[]>([]);
  const [form, setForm] = useState<VitalFormState>(emptyFormState);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('datetime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadVitals() {
      try {
        const result = await getPatientVitals(120);
        if (cancelled) return;
        setVitals(result);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load vitals from backend.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVitals();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredVitals = useMemo(() => {
    return vitals.filter((record) => {
      const timestamp = new Date(record.datetime).getTime();

      if (fromDate) {
        const fromTimestamp = new Date(`${fromDate}T00:00:00`).getTime();
        if (timestamp < fromTimestamp) return false;
      }

      if (toDate) {
        const toTimestamp = new Date(`${toDate}T23:59:59`).getTime();
        if (timestamp > toTimestamp) return false;
      }

      return true;
    });
  }, [fromDate, toDate, vitals]);

  const sortedVitals = useMemo(() => {
    const sorted = [...filteredVitals].sort((a, b) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [filteredVitals, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedVitals.length / PAGE_SIZE));

  const pageRecords = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedVitals.slice(start, start + PAGE_SIZE);
  }, [page, sortedVitals, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [sortKey, sortDirection, fromDate, toDate]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === 'datetime' ? 'desc' : 'asc');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = buildPayload(form);
    if (Object.keys(payload).length === 0) {
      setError('Please provide at least one vital field.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingVitalId) {
        const updated = await updatePatientVital(editingVitalId, payload);
        setVitals((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
        setSuccess('Vital entry updated successfully.');
      } else {
        const created = await createPatientVital(payload);
        setVitals((previous) => [created, ...previous]);
        setSuccess('Vital entry created successfully.');
      }

      setForm({
        ...emptyFormState,
        datetime: toLocalDatetimeInput(new Date().toISOString())
      });
      setEditingVitalId(null);
    } catch (requestError) {
      const fallback = requestError instanceof Error ? requestError.message : 'Unable to save vital entry.';
      setError(fallback);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(vitalId: string) {
    const shouldDelete = window.confirm('Delete this vital record?');
    if (!shouldDelete) return;

    setError('');
    setSuccess('');

    try {
      await deletePatientVital(vitalId);
      setVitals((previous) => previous.filter((item) => item.id !== vitalId));
      if (editingVitalId === vitalId) {
        setEditingVitalId(null);
        setForm({
          ...emptyFormState,
          datetime: toLocalDatetimeInput(new Date().toISOString())
        });
      }
      setSuccess('Vital entry deleted.');
    } catch {
      setError('Unable to delete this record.');
    }
  }

  function handleEdit(record: PortalVitalRecord) {
    setEditingVitalId(record.id);
    setForm(mapRecordToForm(record));
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingVitalId(null);
    setForm({
      ...emptyFormState,
      datetime: toLocalDatetimeInput(new Date().toISOString())
    });
  }

  return (
    <section className="patient-page patient-vitals-page">
      <header className="patient-page-head patient-vitals-head">
        <div>
          <h2>Log Your Vitals</h2>
          <p>Track your daily health metrics</p>
        </div>

        <div className="patient-vitals-head-actions">
          <button type="button" className="patient-secondary-button" onClick={() => window.print()}>
            Export as PDF
          </button>
          <div className="patient-vitals-date-range" aria-label="Filter by date">
            <label>
              From
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>
        </div>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}
      {success ? <p className="patient-success-banner">{success}</p> : null}

      <article className="patient-card patient-vitals-entry-card">
        <div className="patient-card-head">
          <h3>{editingVitalId ? 'Edit Entry' : 'New Entry'}</h3>
          <p>{new Date().toLocaleDateString()}</p>
        </div>

        <form className="patient-vitals-form" onSubmit={handleSubmit}>
          <label className="patient-vitals-row-full">
            Date and Time
            <input
              type="datetime-local"
              value={form.datetime}
              onChange={(event) => setForm((previous) => ({ ...previous, datetime: event.target.value }))}
            />
          </label>

          <div className="patient-vitals-two-col">
            <div className="patient-vitals-fieldset">
              <p className="patient-vitals-fieldset-title">Blood Pressure</p>
              <div className="patient-vitals-inline-inputs">
                <label>
                  Systolic mmHg
                  <input
                    type="number"
                    value={form.systolic}
                    onChange={(event) => setForm((previous) => ({ ...previous, systolic: event.target.value }))}
                  />
                </label>
                <label>
                  Diastolic mmHg
                  <input
                    type="number"
                    value={form.diastolic}
                    onChange={(event) => setForm((previous) => ({ ...previous, diastolic: event.target.value }))}
                  />
                </label>
              </div>
              <p className="patient-field-hint">Normal: 90-120 / 60-80 mmHg</p>
            </div>

            <label className="patient-vitals-fieldset">
              <span className="patient-vitals-fieldset-title">Heart Rate</span>
              <input
                type="number"
                value={form.heartRate}
                onChange={(event) => setForm((previous) => ({ ...previous, heartRate: event.target.value }))}
              />
              <p className="patient-field-hint">Normal: 60-100 bpm</p>
            </label>
          </div>

          <div className="patient-vitals-two-col">
            <label className="patient-vitals-fieldset">
              <span className="patient-vitals-fieldset-title">Oxygen Level (SpO2 %)</span>
              <input
                type="number"
                value={form.spo2}
                onChange={(event) => setForm((previous) => ({ ...previous, spo2: event.target.value }))}
              />
              <p className="patient-field-hint">Normal: 95-100%</p>
            </label>

            <label className="patient-vitals-fieldset">
              <span className="patient-vitals-fieldset-title">Temperature (C)</span>
              <input
                type="number"
                step="0.1"
                value={form.temperatureC}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, temperatureC: event.target.value }))
                }
              />
              <p className="patient-field-hint">Normal: 36.1-37.2 C</p>
            </label>
          </div>

          <div className="patient-vitals-two-col">
            <div className="patient-vitals-fieldset">
              <label>
                <span className="patient-vitals-fieldset-title">Blood Glucose (mg/dL)</span>
                <input
                  type="number"
                  value={form.glucoseValue}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, glucoseValue: event.target.value }))
                  }
                />
              </label>

              <div className="patient-glucose-mode-row">
                {(['fasting', 'post_meal', 'random'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`patient-glucose-mode-pill ${form.glucoseMode === mode ? 'is-active' : ''}`}
                    onClick={() => setForm((previous) => ({ ...previous, glucoseMode: mode }))}
                  >
                    {mode === 'post_meal' ? 'Post-meal' : mode === 'fasting' ? 'Fasting' : 'Random'}
                  </button>
                ))}
              </div>

              <p className="patient-field-hint">
                {form.glucoseMode === 'fasting'
                  ? 'Fasting target: 70-99 mg/dL'
                  : form.glucoseMode === 'post_meal'
                    ? 'Post-meal target: under 140 mg/dL'
                    : 'Random target: under 180 mg/dL'}
              </p>
            </div>

            <label className="patient-vitals-fieldset">
              <span className="patient-vitals-fieldset-title">Weight (kg)</span>
              <input
                type="number"
                step="0.1"
                value={form.weightKg}
                onChange={(event) => setForm((previous) => ({ ...previous, weightKg: event.target.value }))}
              />
            </label>
          </div>

          <label className="patient-vitals-row-full">
            Notes (optional)
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
            />
          </label>

          <div className="patient-vitals-submit-row">
            <button type="submit" className="patient-primary-button" disabled={submitting}>
              {submitting ? 'Saving...' : editingVitalId ? 'Update Entry' : 'Save Vital Entry'}
            </button>
            {editingVitalId ? (
              <button type="button" className="patient-secondary-button" onClick={cancelEdit}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="patient-card patient-vitals-history-card">
        <div className="patient-card-head">
          <h3>History</h3>
          <p>{sortedVitals.length} entries</p>
        </div>

        {loading ? (
          <p className="patient-page-status">Loading vitals...</p>
        ) : sortedVitals.length === 0 ? (
          <p className="patient-empty-state">No vitals logged yet.</p>
        ) : (
          <>
            <div className="patient-table-wrap">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="patient-table-sort" onClick={() => toggleSort('datetime')}>
                        Date and Time
                        <span>{sortKey === 'datetime' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="patient-table-sort"
                        onClick={() => toggleSort('bloodPressure')}
                      >
                        Blood Pressure
                        <span>{sortKey === 'bloodPressure' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="patient-table-sort" onClick={() => toggleSort('heartRate')}>
                        Heart Rate
                        <span>{sortKey === 'heartRate' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="patient-table-sort" onClick={() => toggleSort('spo2')}>
                        SpO2
                        <span>{sortKey === 'spo2' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="patient-table-sort" onClick={() => toggleSort('glucose')}>
                        Glucose
                        <span>{sortKey === 'glucose' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="patient-table-sort" onClick={() => toggleSort('weightKg')}>
                        Weight
                        <span>{sortKey === 'weightKg' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="patient-table-sort"
                        onClick={() => toggleSort('temperatureC')}
                      >
                        Temp
                        <span>{sortKey === 'temperatureC' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="patient-table-sort" onClick={() => toggleSort('risk')}>
                        Risk
                        <span>{sortKey === 'risk' ? sortDirection : 'sort'}</span>
                      </button>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDateTime(record.datetime)}</td>
                      <td>{formatBloodPressure(record.bloodPressure)}</td>
                      <td>{record.heartRate ? `${record.heartRate} bpm` : '-'}</td>
                      <td>{record.spo2 ? `${record.spo2}%` : '-'}</td>
                      <td>{record.glucose?.value ? `${record.glucose.value} mg/dL` : '-'}</td>
                      <td>{record.weightKg ? `${record.weightKg} kg` : '-'}</td>
                      <td>{record.temperatureC ? `${record.temperatureC} C` : '-'}</td>
                      <td>
                        <span className={`patient-risk-pill ${riskClass(record.riskLevel)}`}>
                          {riskLabel(record.riskLevel)}
                        </span>
                      </td>
                      <td>
                        <div className="patient-inline-actions">
                          <button type="button" className="patient-link-button" onClick={() => handleEdit(record)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="patient-link-button danger"
                            onClick={() => handleDelete(record.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
                Page {Math.min(page, totalPages)} of {totalPages}
              </p>
              <button
                type="button"
                className="patient-secondary-button"
                disabled={page >= totalPages}
                onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
