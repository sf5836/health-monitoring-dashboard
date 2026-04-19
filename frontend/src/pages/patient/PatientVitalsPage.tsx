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

export default function PatientVitalsPage() {
  const [vitals, setVitals] = useState<PortalVitalRecord[]>([]);
  const [form, setForm] = useState<VitalFormState>(emptyFormState);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const sortedVitals = useMemo(
    () => [...vitals].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()),
    [vitals]
  );

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
    <section className="patient-page">
      <header className="patient-page-head">
        <div>
          <h2>Log Your Vitals</h2>
          <p>Track your daily health metrics with live risk scoring.</p>
        </div>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}
      {success ? <p className="patient-success-banner">{success}</p> : null}

      <article className="patient-card">
        <h3>{editingVitalId ? 'Edit Entry' : 'New Entry'}</h3>

        <form className="patient-form-grid" onSubmit={handleSubmit}>
          <label>
            Date and Time
            <input
              type="datetime-local"
              value={form.datetime}
              onChange={(event) => setForm((previous) => ({ ...previous, datetime: event.target.value }))}
            />
          </label>

          <label>
            Systolic (mmHg)
            <input
              type="number"
              value={form.systolic}
              onChange={(event) => setForm((previous) => ({ ...previous, systolic: event.target.value }))}
            />
          </label>

          <label>
            Diastolic (mmHg)
            <input
              type="number"
              value={form.diastolic}
              onChange={(event) => setForm((previous) => ({ ...previous, diastolic: event.target.value }))}
            />
          </label>

          <label>
            Heart Rate (bpm)
            <input
              type="number"
              value={form.heartRate}
              onChange={(event) => setForm((previous) => ({ ...previous, heartRate: event.target.value }))}
            />
          </label>

          <label>
            SpO2 (%)
            <input
              type="number"
              value={form.spo2}
              onChange={(event) => setForm((previous) => ({ ...previous, spo2: event.target.value }))}
            />
          </label>

          <label>
            Temperature (C)
            <input
              type="number"
              step="0.1"
              value={form.temperatureC}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, temperatureC: event.target.value }))
              }
            />
          </label>

          <label>
            Glucose (mg/dL)
            <input
              type="number"
              value={form.glucoseValue}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, glucoseValue: event.target.value }))
              }
            />
          </label>

          <label>
            Glucose Mode
            <select
              value={form.glucoseMode}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  glucoseMode: event.target.value as VitalFormState['glucoseMode']
                }))
              }
            >
              <option value="fasting">Fasting</option>
              <option value="post_meal">Post-meal</option>
              <option value="random">Random</option>
            </select>
          </label>

          <label>
            Weight (kg)
            <input
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={(event) => setForm((previous) => ({ ...previous, weightKg: event.target.value }))}
            />
          </label>

          <label className="patient-form-span-2">
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
            />
          </label>

          <div className="patient-form-actions patient-form-span-2">
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

      <article className="patient-card">
        <div className="patient-card-head">
          <h3>Vitals History</h3>
          <p>{sortedVitals.length} entries</p>
        </div>

        {loading ? (
          <p className="patient-page-status">Loading vitals...</p>
        ) : sortedVitals.length === 0 ? (
          <p className="patient-empty-state">No vitals logged yet.</p>
        ) : (
          <div className="patient-table-wrap">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Blood Pressure</th>
                  <th>Heart Rate</th>
                  <th>SpO2</th>
                  <th>Glucose</th>
                  <th>Weight</th>
                  <th>Temp</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedVitals.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDateTime(record.datetime)}</td>
                    <td>{formatBloodPressure(record.bloodPressure)}</td>
                    <td>{record.heartRate ?? '-'}</td>
                    <td>{record.spo2 ? `${record.spo2}%` : '-'}</td>
                    <td>{record.glucose?.value ?? '-'}</td>
                    <td>{record.weightKg ?? '-'}</td>
                    <td>{record.temperatureC ?? '-'}</td>
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
        )}
      </article>
    </section>
  );
}
