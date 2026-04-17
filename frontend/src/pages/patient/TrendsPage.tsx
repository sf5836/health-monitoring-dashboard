import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';
import patientService, { type PatientTrends } from '../../services/patientService';

type RangeOption = 7 | 30 | 90;

export default function TrendsPage() {
	const session = authService.getSession();
	const [days, setDays] = useState<RangeOption>(30);
	const [trends, setTrends] = useState<PatientTrends | null>(null);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		if (!session) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setErrorMessage('');
		patientService
			.getMyTrends(days)
			.then(setTrends)
			.catch((error: unknown) => {
				setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load trends');
			})
			.finally(() => setLoading(false));
	}, [days]);

	const riskSummary = useMemo(() => {
		const records = trends?.vitals || [];
		return {
			high: records.filter((item) => item.riskLevel === 'high').length,
			medium: records.filter((item) => item.riskLevel === 'medium').length,
			normal: records.filter((item) => item.riskLevel === 'normal').length
		};
	}, [trends]);

	if (!session) {
		return (
			<section className="placeholder-page">
				<h2>Health Trends</h2>
				<p>Please login as a patient to view your trend analytics.</p>
				<Link to="/login">Go to Login</Link>
			</section>
		);
	}

	return (
		<main className="hm-container" style={{ padding: '1.5rem 0' }}>
			<section className="hm-section-head">
				<h2>Health Trends</h2>
				<p>Live trend analytics for your recent vital history</p>
			</section>

			<section className="hm-hero-actions" style={{ marginBottom: '1rem' }}>
				<button className="hm-btn hm-btn-outline" type="button" onClick={() => setDays(7)}>
					Last 7 Days
				</button>
				<button className="hm-btn hm-btn-outline" type="button" onClick={() => setDays(30)}>
					Last 30 Days
				</button>
				<button className="hm-btn hm-btn-outline" type="button" onClick={() => setDays(90)}>
					Last 90 Days
				</button>
			</section>

			{loading ? <p>Loading trends...</p> : null}
			{errorMessage ? <p>{errorMessage}</p> : null}

			<section className="hm-grid-3" style={{ marginBottom: '1rem' }}>
				<article className="hm-card">
					<p className="hm-meta">Total Records</p>
					<h3>{trends?.totalRecords || 0}</h3>
				</article>
				<article className="hm-card">
					<p className="hm-meta">Risk Alerts</p>
					<h3>
						{riskSummary.high} high / {riskSummary.medium} medium
					</h3>
				</article>
				<article className="hm-card">
					<p className="hm-meta">Healthy Readings</p>
					<h3>{riskSummary.normal}</h3>
				</article>
			</section>

			<section className="hm-grid-3" style={{ marginBottom: '1rem' }}>
				<article className="hm-card">
					<p className="hm-meta">Avg Heart Rate</p>
					<h3>{trends?.average.heartRate ?? '-'}</h3>
				</article>
				<article className="hm-card">
					<p className="hm-meta">Avg Blood Pressure</p>
					<h3>
						{trends?.average.systolic ?? '-'} / {trends?.average.diastolic ?? '-'}
					</h3>
				</article>
				<article className="hm-card">
					<p className="hm-meta">Avg Glucose</p>
					<h3>
						{trends?.vitals.length
							? Number(
									(
										trends.vitals.reduce((acc, item) => acc + (item.glucose?.value || 0), 0) /
										trends.vitals.length
									).toFixed(2)
							  )
							: '-'}
					</h3>
				</article>
			</section>

			<section className="hm-card">
				<h3>Recent Readings ({days} days)</h3>
				{!loading && !trends?.vitals.length ? <p>No trend records found for this period.</p> : null}
				{trends?.vitals.length ? (
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
								</tr>
							</thead>
							<tbody>
								{trends.vitals
									.slice()
									.reverse()
									.slice(0, 25)
									.map((item) => (
										<tr key={item._id}>
											<td>{new Date(item.datetime).toLocaleString()}</td>
											<td>
												{item.bloodPressure?.systolic ?? '-'} / {item.bloodPressure?.diastolic ?? '-'}
											</td>
											<td>{item.heartRate ?? '-'}</td>
											<td>{item.spo2 ?? '-'}</td>
											<td>{item.glucose?.value ?? '-'}</td>
											<td>{item.riskLevel || 'normal'}</td>
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
