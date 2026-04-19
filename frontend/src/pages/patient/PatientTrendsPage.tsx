import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { getPatientTrends, type PortalVitalRecord } from '../../services/patientPortalService';
import { formatDate, riskClass, riskLabel } from './patientUi';

type MetricKey = 'bloodPressure' | 'heartRate' | 'glucose' | 'weightKg' | 'spo2' | 'temperatureC';

type DataPoint = {
  x: string;
  y: number;
};

const METRICS: Array<{
  key: MetricKey;
  label: string;
  unit: string;
  picker: (entry: PortalVitalRecord) => number | undefined;
  range?: [number, number];
}> = [
  {
    key: 'bloodPressure',
    label: 'Blood Pressure (Systolic)',
    unit: 'mmHg',
    picker: (entry) => entry.bloodPressure?.systolic,
    range: [90, 120]
  },
  {
    key: 'heartRate',
    label: 'Heart Rate',
    unit: 'bpm',
    picker: (entry) => entry.heartRate,
    range: [60, 100]
  },
  {
    key: 'glucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    picker: (entry) => entry.glucose?.value,
    range: [70, 140]
  },
  {
    key: 'weightKg',
    label: 'Weight',
    unit: 'kg',
    picker: (entry) => entry.weightKg
  },
  {
    key: 'spo2',
    label: 'SpO2',
    unit: '%',
    picker: (entry) => entry.spo2,
    range: [95, 100]
  },
  {
    key: 'temperatureC',
    label: 'Temperature',
    unit: 'C',
    picker: (entry) => entry.temperatureC,
    range: [36.1, 37.2]
  }
];

function normalizePoints(values: DataPoint[], width: number, height: number, padding: number): string {
  if (values.length === 0) return '';

  const ys = values.map((item) => item.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;

  return values
    .map((item, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((item.y - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function bpPath(vitals: PortalVitalRecord[], which: 'systolic' | 'diastolic'): DataPoint[] {
  return vitals
    .map((entry) => ({
      x: entry.datetime,
      y: which === 'systolic' ? entry.bloodPressure?.systolic || NaN : entry.bloodPressure?.diastolic || NaN
    }))
    .filter((point) => Number.isFinite(point.y));
}

export default function PatientTrendsPage() {
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<MetricKey>('bloodPressure');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vitals, setVitals] = useState<PortalVitalRecord[]>([]);
  const [average, setAverage] = useState<{
    heartRate: number | null;
    spo2: number | null;
    temperatureC: number | null;
    weightKg: number | null;
    systolic: number | null;
    diastolic: number | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      try {
        const response = await getPatientTrends(days);
        if (cancelled) return;
        setVitals(response.vitals);
        setAverage(response.average);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load trend data.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadTrends();

    return () => {
      cancelled = true;
    };
  }, [days]);

  const selectedMetric = useMemo(
    () => METRICS.find((item) => item.key === metric) || METRICS[0],
    [metric]
  );

  const points = useMemo(
    () =>
      vitals
        .map((entry) => ({
          x: entry.datetime,
          y: selectedMetric.picker(entry)
        }))
        .filter((item): item is DataPoint => Number.isFinite(item.y)),
    [selectedMetric, vitals]
  );

  const systolicPoints = useMemo(() => bpPath(vitals, 'systolic'), [vitals]);
  const diastolicPoints = useMemo(() => bpPath(vitals, 'diastolic'), [vitals]);

  const width = 840;
  const height = 320;
  const padding = 24;

  const linePath = normalizePoints(points, width, height, padding);
  const systolicPath = normalizePoints(systolicPoints, width, height, padding);
  const diastolicPath = normalizePoints(diastolicPoints, width, height, padding);

  const statValues = useMemo(() => {
    if (points.length === 0) {
      return {
        min: '-',
        max: '-',
        avg: '-',
        outliers: 0
      };
    }

    const values = points.map((item) => item.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

    const [rangeMin, rangeMax] = selectedMetric.range || [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    const outliers = values.filter((value) => value < rangeMin || value > rangeMax).length;

    return {
      min: `${min.toFixed(1)} ${selectedMetric.unit}`,
      max: `${max.toFixed(1)} ${selectedMetric.unit}`,
      avg: `${avg.toFixed(1)} ${selectedMetric.unit}`,
      outliers
    };
  }, [points, selectedMetric]);

  const flaggedReadings = useMemo(
    () => vitals.filter((entry) => entry.riskLevel !== 'normal').slice(-5).reverse(),
    [vitals]
  );

  function renderAverageSummary() {
    if (!average) return 'No average available.';

    return `AVG HR ${average.heartRate ?? '-'} | AVG SpO2 ${average.spo2 ?? '-'} | AVG SYS ${average.systolic ?? '-'} | AVG DIA ${average.diastolic ?? '-'}`;
  }

  return (
    <section className="patient-page">
      <header className="patient-page-head">
        <div>
          <h2>Health Trends</h2>
          <p>Visualize your health patterns over time.</p>
        </div>
        <button type="button" className="patient-secondary-button" onClick={() => window.print()}>
          Export Chart as PDF
        </button>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <section className="patient-tab-row">
        {METRICS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`patient-tab-pill ${item.key === metric ? 'is-active' : ''}`}
            onClick={() => setMetric(item.key)}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="patient-tab-row">
        {[7, 30, 90].map((range) => (
          <button
            key={range}
            type="button"
            className={`patient-tab-pill ${range === days ? 'is-active' : ''}`}
            onClick={() => setDays(range)}
          >
            {range} Days
          </button>
        ))}
      </section>

      <article className="patient-card">
        <h3>
          {selectedMetric.label} - Last {days} Days
        </h3>
        {loading ? (
          <p className="patient-page-status">Loading trend chart...</p>
        ) : (
          <svg className="patient-trend-chart" viewBox={`0 0 ${width} ${height}`}>
            <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
            {selectedMetric.range ? (
              <rect x={padding} y={height * 0.24} width={width - padding * 2} height={height * 0.28} fill="rgba(45, 196, 141, 0.12)" />
            ) : null}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="patient-axis" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="patient-axis" />

            {metric === 'bloodPressure' ? (
              <>
                <path d={systolicPath} className="patient-trend-line" />
                <path d={diastolicPath} className="patient-trend-line-alt" />
              </>
            ) : (
              <path d={linePath} className="patient-trend-line" />
            )}
          </svg>
        )}

        <p className="patient-micro-copy">{renderAverageSummary()}</p>
      </article>

      <section className="patient-grid patient-summary-grid">
        <article className="patient-card">
          <h3>Minimum</h3>
          <p className="patient-metric-value">{statValues.min}</p>
        </article>
        <article className="patient-card">
          <h3>Maximum</h3>
          <p className="patient-metric-value">{statValues.max}</p>
        </article>
        <article className="patient-card">
          <h3>Average</h3>
          <p className="patient-metric-value">{statValues.avg}</p>
        </article>
        <article className="patient-card">
          <h3>Out of Range</h3>
          <p className="patient-metric-value">{statValues.outliers}</p>
        </article>
      </section>

      <article className="patient-card">
        <div className="patient-card-head">
          <h3>Flagged Readings</h3>
          <Link to={ROUTE_PATHS.patient.vitals} className="patient-link-button">
            View in Vitals History
          </Link>
        </div>

        {flaggedReadings.length === 0 ? (
          <p className="patient-empty-state">No flagged readings in this range.</p>
        ) : (
          <ul className="patient-list">
            {flaggedReadings.map((entry) => (
              <li key={entry.id} className="patient-list-item">
                <div>
                  <p>{formatDate(entry.datetime)}</p>
                  <small>{entry.riskReasons.join(', ') || 'Risk threshold exceeded'}</small>
                </div>
                <span className={`patient-risk-pill ${riskClass(entry.riskLevel)}`}>
                  {riskLabel(entry.riskLevel)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
