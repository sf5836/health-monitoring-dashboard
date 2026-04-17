import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import patientService, {
	type PatientVitalPayload,
	type PatientVitalRecord
} from '../../services/patientService';

const emptyForm: PatientVitalPayload = {
	datetime: new Date().toISOString().slice(0, 16),
	bloodPressure: { systolic: undefined, diastolic: undefined },
	heartRate: undefined,
	spo2: undefined,
	temperatureC: undefined,
	glucose: { value: undefined, mode: 'fasting' },
	weightKg: undefined,
	notes: ''
};

function toNum(value: string): number | undefined {
	if (!value.trim()) return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function toInputDateTime(value?: string): string {
	if (!value) return new Date().toISOString().slice(0, 16);
	return new Date(value).toISOString().slice(0, 16);
}

export default function VitalsPage() {
	const session = authService.getSession();
	const [vitals, setVitals] = useState<PatientVitalRecord[]>([]);
	const [form, setForm] = useState<PatientVitalPayload>(emptyForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const loadData = async () => {
		setLoading(true);
		setErrorMessage('');
		try {
			const data = await patientService.getMyVitals(100);
			setVitals(data);
		} catch (error) {
			setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load vitals');
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

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setErrorMessage('');
		try {
			const payload: PatientVitalPayload = {
				datetime: form.datetime,
				bloodPressure: {
					systolic: form.bloodPressure?.systolic,
					diastolic: form.bloodPressure?.diastolic
				},
				heartRate: form.heartRate,
				spo2: form.spo2,
				temperatureC: form.temperatureC,
				glucose: {
					value: form.glucose?.value,
					mode: form.glucose?.mode
				},
				weightKg: form.weightKg,
				notes: form.notes?.trim() || undefined
			};
			if (editingId) {
				await patientService.updateMyVital(editingId, payload);
			} else {
				await patientService.createMyVital(payload);
			}
			setEditingId(null);
			setForm(emptyForm);
			await loadData();
		} catch (error) {
			setErrorMessage(error instanceof ApiError ? error.message : 'Failed to save vital');
		} finally {
			setSubmitting(false);
		}
	};

	const editRecord = (record: PatientVitalRecord) => {
		setEditingId(record._id);
		setForm({
			datetime: toInputDateTime(record.datetime),
			bloodPressure: {
				systolic: record.bloodPressure?.systolic,
				diastolic: record.bloodPressure?.diastolic
			},
			heartRate: record.heartRate,
			spo2: record.spo2,
			temperatureC: record.temperatureC,
			glucose: {
				value: record.glucose?.value,
				mode: record.glucose?.mode || 'fasting'
			},
			weightKg: record.weightKg,
			notes: record.notes || ''
		});
	};

	const removeRecord = async (vitalId: string) => {
		try {
			await patientService.deleteMyVital(vitalId);
			if (editingId === vitalId) {
				setEditingId(null);
				setForm(emptyForm);
			}
			await loadData();
		} catch (error) {
			setErrorMessage(error instanceof ApiError ? error.message : 'Failed to delete vital');
		}
	};

	if (!session) {
		return (
			<section className="placeholder-page">
				<h2>Vitals</h2>
				<p>Please login as a patient to view and manage live vitals.</p>
				<Link to="/login">Go to Login</Link>
			</section>
		);
	}

	return (
		<main className="hm-container" style={{ padding: '1.5rem 0' }}>
			<section className="hm-section-head">
				<h2>My Vitals</h2>
				<p>Real-time records from your health database</p>
			</section>

			{errorMessage ? <p>{errorMessage}</p> : null}

			<section className="hm-card" style={{ marginBottom: '1rem' }}>
				<h3>{editingId ? 'Edit Vital Entry' : 'New Vital Entry'}</h3>
				<form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
					<input
						type="datetime-local"
						value={form.datetime || ''}
						onChange={(event) => setForm((prev) => ({ ...prev, datetime: event.target.value }))}
						required
					/>
					<div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
						<input
							type="number"
							placeholder="Systolic"
							value={form.bloodPressure?.systolic ?? ''}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									bloodPressure: {
										...prev.bloodPressure,
										systolic: toNum(event.target.value)
									}
								}))
							}
						/>
						<input
							type="number"
							placeholder="Diastolic"
							value={form.bloodPressure?.diastolic ?? ''}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									bloodPressure: {
										...prev.bloodPressure,
										diastolic: toNum(event.target.value)
									}
								}))
							}
						/>
					</div>
					<div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
						<input
							type="number"
							placeholder="Heart Rate"
							value={form.heartRate ?? ''}
							onChange={(event) => setForm((prev) => ({ ...prev, heartRate: toNum(event.target.value) }))}
						/>
						<input
							type="number"
							placeholder="SpO2"
							value={form.spo2 ?? ''}
							onChange={(event) => setForm((prev) => ({ ...prev, spo2: toNum(event.target.value) }))}
						/>
						<input
							type="number"
							step="0.1"
							placeholder="Temperature °C"
							value={form.temperatureC ?? ''}
							onChange={(event) =>
								setForm((prev) => ({ ...prev, temperatureC: toNum(event.target.value) }))
							}
						/>
						<input
							type="number"
							step="0.1"
							placeholder="Weight kg"
							value={form.weightKg ?? ''}
							onChange={(event) =>
								setForm((prev) => ({ ...prev, weightKg: toNum(event.target.value) }))
							}
						/>
					</div>
					<div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: '2fr 1fr' }}>
						<input
							type="number"
							placeholder="Glucose"
							value={form.glucose?.value ?? ''}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									glucose: { ...prev.glucose, value: toNum(event.target.value) }
								}))
							}
						/>
						<select
							value={form.glucose?.mode || 'fasting'}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									glucose: {
										...prev.glucose,
										mode: event.target.value as 'fasting' | 'post_meal' | 'random'
									}
								}))
							}
						>
							<option value="fasting">Fasting</option>
							<option value="post_meal">Post-meal</option>
							<option value="random">Random</option>
						</select>
					</div>
					<textarea
						rows={3}
						placeholder="Notes (optional)"
						value={form.notes || ''}
						onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
					/>
					<div style={{ display: 'flex', gap: '0.6rem' }}>
						<button className="hm-btn hm-btn-primary" type="submit" disabled={submitting}>
							{submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
						</button>
						{editingId ? (
							<button
								className="hm-btn hm-btn-outline"
								type="button"
								onClick={() => {
									setEditingId(null);
									setForm(emptyForm);
								}}
							>
								Cancel Edit
							</button>
						) : null}
					</div>
				</form>
			</section>

			<section className="hm-card">
				<h3>History</h3>
				{loading ? <p>Loading vitals...</p> : null}
				{!loading && vitals.length === 0 ? <p>No vital entries found.</p> : null}
				{vitals.length > 0 ? (
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse' }}>
							<thead>
								<tr>
									<th align="left">Date</th>
									<th align="left">BP</th>
									<th align="left">HR</th>
									<th align="left">SpO2</th>
									<th align="left">Glucose</th>
									<th align="left">Risk</th>
									<th align="left">Actions</th>
								</tr>
							</thead>
							<tbody>
								{vitals.map((item) => (
									<tr key={item._id}>
										<td>{new Date(item.datetime).toLocaleString()}</td>
										<td>
											{item.bloodPressure?.systolic ?? '-'} / {item.bloodPressure?.diastolic ?? '-'}
										</td>
										<td>{item.heartRate ?? '-'}</td>
										<td>{item.spo2 ?? '-'}</td>
										<td>{item.glucose?.value ?? '-'}</td>
										<td>{item.riskLevel || 'normal'}</td>
										<td style={{ display: 'flex', gap: '0.4rem' }}>
											<button
												type="button"
												className="hm-btn hm-btn-outline"
												onClick={() => editRecord(item)}
											>
												Edit
											</button>
											<button
												type="button"
												className="hm-btn hm-btn-outline"
												onClick={() => removeRecord(item._id)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : null}
			</section>
		</main>
	);
}
