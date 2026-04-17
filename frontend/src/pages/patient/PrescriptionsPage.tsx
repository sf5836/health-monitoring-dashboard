import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import patientService, { type PatientPrescription } from '../../services/patientService';

type SortOrder = 'Latest' | 'Oldest';

export default function PrescriptionsPage() {
	const session = authService.getSession();
	const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
	const [sortBy, setSortBy] = useState<SortOrder>('Latest');
	const [expandedIds, setExpandedIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	const loadData = async () => {
		setLoading(true);
		setErrorMessage('');
		try {
			const data = await patientService.getMyPrescriptions();
			setPrescriptions(data);
			setExpandedIds(data.length ? [data[0]._id] : []);
		} catch (error) {
			setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load prescriptions');
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

	const sortedPrescriptions = useMemo(() => {
		const copy = [...prescriptions];
		copy.sort((a, b) => {
			const aTs = new Date(a.issuedAt).getTime();
			const bTs = new Date(b.issuedAt).getTime();
			return sortBy === 'Latest' ? bTs - aTs : aTs - bTs;
		});
		return copy;
	}, [prescriptions, sortBy]);

	const toggleExpanded = (id: string) => {
		setExpandedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
	};

	const downloadPrescription = async (item: PatientPrescription) => {
		try {
			const pdfUrl = item.pdfUrl || (await patientService.getPrescriptionPdf(item._id)).pdfUrl;
			window.open(pdfUrl, '_blank', 'noopener,noreferrer');
		} catch (error) {
			setErrorMessage(error instanceof ApiError ? error.message : 'Failed to fetch prescription PDF');
		}
	};

	if (!session) {
		return (
			<section className="placeholder-page">
				<h2>Prescriptions</h2>
				<p>Please login as a patient to view your prescriptions.</p>
				<Link to="/login">Go to Login</Link>
			</section>
		);
	}

	return (
		<main className="hm-container" style={{ padding: '1.5rem 0' }}>
			<section className="hm-section-head">
				<h2>My Prescriptions</h2>
				<p>Live prescriptions and medication details from your doctors</p>
			</section>

			{errorMessage ? <p>{errorMessage}</p> : null}

			<section className="hm-card" style={{ marginBottom: '1rem' }}>
				<label>
					Sort
					<select
						value={sortBy}
						onChange={(event) => setSortBy(event.target.value as SortOrder)}
						style={{ marginLeft: '0.5rem' }}
					>
						<option value="Latest">Latest First</option>
						<option value="Oldest">Oldest First</option>
					</select>
				</label>
			</section>

			{loading ? <p>Loading prescriptions...</p> : null}
			{!loading && sortedPrescriptions.length === 0 ? <p>No prescriptions available yet.</p> : null}

			{sortedPrescriptions.map((item) => {
				const expanded = expandedIds.includes(item._id);
				return (
					<article key={item._id} className="hm-card" style={{ marginBottom: '0.8rem' }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: '0.8rem',
								flexWrap: 'wrap'
							}}
						>
							<div>
								<h3 style={{ margin: 0 }}>{item.doctorId?.fullName || 'Doctor'}</h3>
								<p className="hm-meta" style={{ margin: '0.25rem 0 0' }}>
									{new Date(item.issuedAt).toLocaleDateString()} · {item.diagnosis || 'General prescription'}
								</p>
							</div>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<button className="hm-btn hm-btn-outline" type="button" onClick={() => toggleExpanded(item._id)}>
									{expanded ? 'Hide' : 'View'} Medications
								</button>
								<button className="hm-btn hm-btn-primary" type="button" onClick={() => downloadPrescription(item)}>
									Download PDF
								</button>
							</div>
						</div>

						{expanded ? (
							<div style={{ marginTop: '0.8rem' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse' }}>
									<thead>
										<tr>
											<th align="left">Medication</th>
											<th align="left">Dosage</th>
											<th align="left">Frequency</th>
											<th align="left">Duration</th>
										</tr>
									</thead>
									<tbody>
										{item.medications.map((medication) => (
											<tr key={`${item._id}-${medication.name}`}>
												<td>{medication.name}</td>
												<td>{medication.dosage || '-'}</td>
												<td>{medication.frequency || '-'}</td>
												<td>{medication.duration || '-'}</td>
											</tr>
										))}
									</tbody>
								</table>
								{item.instructions ? <p style={{ marginTop: '0.7rem' }}>{item.instructions}</p> : null}
							</div>
						) : null}
					</article>
				);
			})}
		</main>
	);
}
