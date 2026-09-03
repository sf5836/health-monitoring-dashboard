import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ROUTE_PATHS } from '../../routes/routePaths';
import {
  getConnectedDoctors,
  getPatientDashboard,
  getPatientPrescriptions,
  getPatientTrends,
  type ConnectedDoctor,
  type PortalDashboard,
  type PortalPrescription,
  type PortalVitalRecord
} from '../../services/patientPortalService';
import {
  formatBloodPressure,
  formatDate,
  formatDateTime,
  greetingByTime,
  riskClass,
  riskLabel
} from './patientUi';

function metricSeries(vitals: PortalVitalRecord[], picker: (item: PortalVitalRecord) => number | undefined): number[] {
  return vitals
    .map((item) => picker(item))
    .filter((value): value is number => Number.isFinite(value));
}

function sparklinePath(values: number[], width = 180, height = 56): string {
  if (values.length === 0) return `M 0 ${height / 2} L ${width} ${height / 2}`;
  if (values.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function renderVitalsSummary(vital: PortalVitalRecord): string {
  return [
    formatBloodPressure(vital.bloodPressure) !== '-' ? `BP ${formatBloodPressure(vital.bloodPressure)}` : '',
    vital.heartRate ? `HR ${vital.heartRate}` : '',
    vital.glucose?.value ? `Glucose ${vital.glucose.value}` : '',
    vital.spo2 ? `SpO2 ${vital.spo2}%` : ''
  ]
    .filter(Boolean)
    .join(' | ');
}

function resolveRiskLevel(detail: {
  bloodPressure?: { systolic?: number; diastolic?: number };
  heartRate?: number;
  spo2?: number;
}): PortalVitalRecord['riskLevel'] {
  const systolic = detail.bloodPressure?.systolic || 0;
  const diastolic = detail.bloodPressure?.diastolic || 0;
  const heartRate = detail.heartRate || 0;
  const spo2 = detail.spo2 || 0;

  if (systolic >= 140 || diastolic >= 90 || heartRate >= 115 || (spo2 > 0 && spo2 < 94)) return 'high';
  if (systolic >= 130 || diastolic >= 85 || heartRate >= 100 || (spo2 > 0 && spo2 < 96)) return 'medium';
  return 'normal';
}

function buildDemoVitals(tick: number, count: number, stepHours: number): PortalVitalRecord[] {
  const now = new Date();

  return Array.from({ length: count }).map((_, index) => {
    const shift = tick + index;
    const systolic = 118 + Math.round(10 * Math.sin(shift / 2));
    const diastolic = 76 + Math.round(6 * Math.cos(shift / 3));
    const heartRate = 72 + Math.round(12 * Math.sin(shift / 4));
    const spo2 = 97 + Math.round(2 * Math.cos(shift / 5));
    const glucose = 92 + Math.round(14 * Math.sin(shift / 3));

    const bloodPressure = { systolic, diastolic };
    const riskLevel = resolveRiskLevel({ bloodPressure, heartRate, spo2 });

    return {
      id: `demo-${tick}-${index}`,
      datetime: new Date(now.getTime() - index * stepHours * 60 * 60 * 1000).toISOString(),
      bloodPressure,
      heartRate,
      spo2,
      temperatureC: 36.6 + Number((0.3 * Math.sin(shift / 6)).toFixed(1)),
      glucose: {
        value: glucose,
        mode: 'random'
      },
      weightKg: 72 + Math.round(2 * Math.cos(shift / 6)),
      notes: 'Auto-generated demo reading',
      riskLevel,
      riskReasons: riskLevel === 'normal' ? [] : ['Demo risk threshold triggered']
    };
  });
}

function buildDemoDashboard(tick: number): { dashboard: PortalDashboard; weeklyVitals: PortalVitalRecord[] } {
  const latestVitals = buildDemoVitals(tick, 5, 6);
  const weeklyVitals = buildDemoVitals(tick, 10, 18).reverse();
  const highRiskCount = latestVitals.filter((item) => item.riskLevel === 'high').length;

  return {
    dashboard: {
      latestVitals,
      metrics: {
        highRiskCount,
        upcomingAppointments: 0,
        prescriptionCount: 0
      },
      currentRiskLevel: latestVitals[0]?.riskLevel || 'normal',
      upcomingAppointments: []
    },
    weeklyVitals
  };
}

export default function PatientDashboardPage() {
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [doctors, setDoctors] = useState<ConnectedDoctor[]>([]);
  const [prescriptions, setPrescriptions] = useState<PortalPrescription[]>([]);
  const [weeklyVitals, setWeeklyVitals] = useState<PortalVitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboardData, connectedDoctors, prescriptionData, trendsData] = await Promise.all([
          getPatientDashboard(),
          getConnectedDoctors(),
          getPatientPrescriptions(),
          getPatientTrends(7)
        ]);

        if (cancelled) return;

        const hasVitals = dashboardData.latestVitals.length > 0 || trendsData.vitals.length > 0;
        if (!hasVitals) {
          setDemoMode(true);
          return;
        }

        setDashboard(dashboardData);
        setDoctors(connectedDoctors);
        setPrescriptions(prescriptionData);
        setWeeklyVitals(trendsData.vitals);
        setError('');
      } catch {
        if (cancelled) return;
        setDemoMode(true);
        setError('');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!demoMode) {
      loadDashboard();
    }

    const intervalId = demoMode ? undefined : window.setInterval(loadDashboard, 30000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [demoMode]);

  useEffect(() => {
    if (!demoMode) return undefined;

    let tick = 0;
    const applyDemo = () => {
      const payload = buildDemoDashboard(tick);
      setDashboard(payload.dashboard);
      setWeeklyVitals(payload.weeklyVitals);
      setLoading(false);
      tick += 1;
    };

    applyDemo();
    const intervalId = window.setInterval(applyDemo, 4000);
    return () => window.clearInterval(intervalId);
  }, [demoMode]);

  const latestVital = dashboard?.latestVitals[0];
  const previousVital = dashboard?.latestVitals[1];

  const quickStats = useMemo(() => {
    if (!latestVital) {
      return [
        { label: 'Blood Pressure', value: '-', unit: 'mmHg', delta: '-', risk: 'normal' as const },
        { label: 'Heart Rate', value: '-', unit: 'bpm', delta: '-', risk: 'normal' as const },
        { label: 'Blood Glucose', value: '-', unit: 'mg/dL', delta: '-', risk: 'normal' as const },
        { label: 'Oxygen (SpO2)', value: '-', unit: '%', delta: '-', risk: 'normal' as const }
      ];
    }

    const bpDelta =
      latestVital.bloodPressure?.systolic && previousVital?.bloodPressure?.systolic
        ? latestVital.bloodPressure.systolic - previousVital.bloodPressure.systolic
        : null;

    return [
      {
        label: 'Blood Pressure',
        value: formatBloodPressure(latestVital.bloodPressure),
        unit: 'mmHg',
        delta: bpDelta === null ? '-' : `${bpDelta > 0 ? '+' : ''}${bpDelta} vs previous`,
        risk: dashboard?.currentRiskLevel || latestVital.riskLevel
      },
      {
        label: 'Heart Rate',
        value: latestVital.heartRate ? String(latestVital.heartRate) : '-',
        unit: 'bpm',
        delta:
          latestVital.heartRate && previousVital?.heartRate
            ? `${latestVital.heartRate - previousVital.heartRate} vs previous`
            : '-',
        risk: dashboard?.currentRiskLevel || latestVital.riskLevel
      },
      {
        label: 'Blood Glucose',
        value: latestVital.glucose?.value ? String(latestVital.glucose.value) : '-',
        unit: 'mg/dL',
        delta: '-',
        risk: dashboard?.currentRiskLevel || latestVital.riskLevel
      },
      {
        label: 'Oxygen (SpO2)',
        value: latestVital.spo2 ? String(latestVital.spo2) : '-',
        unit: '%',
        delta: '-',
        risk: dashboard?.currentRiskLevel || latestVital.riskLevel
      }
    ];
  }, [dashboard?.currentRiskLevel, latestVital, previousVital]);

  const sparklineCards = useMemo(() => {
    const heartRates = metricSeries(weeklyVitals, (item) => item.heartRate);
    const spo2 = metricSeries(weeklyVitals, (item) => item.spo2);
    const glucose = metricSeries(weeklyVitals, (item) => item.glucose?.value);
    const systolic = metricSeries(weeklyVitals, (item) => item.bloodPressure?.systolic);

    return [
      {
        title: 'Heart Rate',
        latest: heartRates.length > 0 ? heartRates[heartRates.length - 1] : undefined,
        unit: 'bpm',
        path: sparklinePath(heartRates)
      },
      {
        title: 'SpO2',
        latest: spo2.length > 0 ? spo2[spo2.length - 1] : undefined,
        unit: '%',
        path: sparklinePath(spo2)
      },
      {
        title: 'Glucose',
        latest: glucose.length > 0 ? glucose[glucose.length - 1] : undefined,
        unit: 'mg/dL',
        path: sparklinePath(glucose)
      },
      {
        title: 'Systolic BP',
        latest: systolic.length > 0 ? systolic[systolic.length - 1] : undefined,
        unit: 'mmHg',
        path: sparklinePath(systolic)
      }
    ];
  }, [weeklyVitals]);

  if (loading) {
    return <p className="patient-page-status">Loading patient dashboard...</p>;
  }

  return (
    <section className="patient-page">
      {error ? <p className="patient-error-banner">{error}</p> : null}
      {demoMode ? <p className="patient-success-banner">Showing live demo vitals for testing.</p> : null}

      <article className="patient-welcome-banner">
        <div>
          <p className="patient-eyebrow">{greetingByTime()}</p>
          <h2>Health Overview</h2>
          <p>{formatDate(new Date().toISOString())}</p>
        </div>
        <div className="patient-welcome-metrics">
          <p>High Risk Alerts: {dashboard?.metrics.highRiskCount || 0}</p>
          <p>Upcoming Appointments: {dashboard?.metrics.upcomingAppointments || 0}</p>
          <p>Active Prescriptions: {dashboard?.metrics.prescriptionCount || 0}</p>
        </div>
      </article>

      <section className="patient-grid patient-quick-stats-grid">
        {quickStats.map((item) => (
          <article key={item.label} className="patient-card patient-stat-card">
            <p className="patient-card-title">{item.label}</p>
            <p className="patient-metric-value">
              {item.value} <span>{item.unit}</span>
            </p>
            <p className={`patient-risk-pill ${riskClass(item.risk)}`}>{riskLabel(item.risk)}</p>
            <small>{item.delta}</small>
          </article>
        ))}
      </section>

      <section className="patient-grid patient-sparkline-grid">
        {sparklineCards.map((item) => (
          <article key={item.title} className="patient-card patient-sparkline-card">
            <div className="patient-sparkline-head">
              <p>{item.title}</p>
              <strong>
                {item.latest ?? '-'} {item.unit}
              </strong>
            </div>
            <svg viewBox="0 0 180 56" preserveAspectRatio="none" aria-label={`${item.title} trend`}>
              <path d={item.path} className="patient-sparkline-path" />
            </svg>
          </article>
        ))}
      </section>

      <section className="patient-grid patient-main-grid">
        <article className="patient-card">
          <div className="patient-card-head">
            <h3>Recent Vital Entries</h3>
            <Link to={ROUTE_PATHS.patient.vitals} className="patient-link-button">
              Log New Vitals
            </Link>
          </div>

          {dashboard?.latestVitals.length ? (
            <ul className="patient-list">
              {dashboard.latestVitals.map((vital) => (
                <li key={vital.id} className="patient-list-item">
                  <div>
                    <p>{renderVitalsSummary(vital) || 'No values submitted'}</p>
                    <small>{formatDateTime(vital.datetime)}</small>
                  </div>
                  <span className={`patient-risk-pill ${riskClass(vital.riskLevel)}`}>
                    {riskLabel(vital.riskLevel)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="patient-empty-state">No vital entries yet. Add your first reading.</p>
          )}
        </article>

        <div className="patient-column-stack">
          <article className="patient-card">
            <h3>Upcoming Appointments</h3>
            {dashboard?.upcomingAppointments.length ? (
              <ul className="patient-list">
                {dashboard.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <li key={appointment.id} className="patient-list-item">
                    <div>
                      <p>{appointment.doctorName}</p>
                      <small>
                        {appointment.date} at {appointment.time} ({appointment.type})
                      </small>
                    </div>
                    <Link to={ROUTE_PATHS.patient.appointments} className="patient-link-button">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="patient-empty-state">No upcoming appointments.</p>
            )}
          </article>

          <article className="patient-card">
            <h3>Connected Doctors</h3>
            {doctors.length ? (
              <ul className="patient-list">
                {doctors.slice(0, 3).map((doctor) => (
                  <li key={doctor.doctorUserId} className="patient-list-item">
                    <div>
                      <p>{doctor.fullName}</p>
                      <small>{doctor.specialization || 'Specialist'}</small>
                    </div>
                    <Link to={ROUTE_PATHS.patient.messages} className="patient-link-button">
                      Message
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="patient-empty-state">No doctors connected yet.</p>
            )}
          </article>

          <article className="patient-card">
            <h3>Active Prescriptions</h3>
            <p className="patient-empty-state">
              {prescriptions.length > 0
                ? `${prescriptions.length} prescriptions available. Latest: ${prescriptions[0].diagnosis || 'General care'}`
                : 'No prescriptions available.'}
            </p>
          </article>
        </div>
      </section>

      <section className="patient-grid patient-action-grid">
        <Link to={ROUTE_PATHS.patient.vitals} className="patient-action-card">
          Log Vitals
        </Link>
        <Link to={ROUTE_PATHS.patient.doctors} className="patient-action-card">
          Find Doctor
        </Link>
        <Link to={ROUTE_PATHS.patient.appointments} className="patient-action-card">
          Book Appointment
        </Link>
      </section>
    </section>
  );
}
