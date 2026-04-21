import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { getPatientTrends, type PortalVitalRecord } from '../../services/patientPortalService';
import { formatDate, riskClass, riskLabel } from './patientUi';

type MetricKey = 'bloodPressure' | 'heartRate' | 'glucose' | 'weightKg' | 'spo2' | 'temperatureC';
type DateRangeKey = '7d' | '30d' | '90d' | 'custom';

type DataPoint = {
  x: string;
  y: number;
};

type NormalizedPoint = {
  x: number;
  y: number;
  raw: DataPoint;
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
    label: 'Blood Pressure',
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

function bpPath(vitals: PortalVitalRecord[], which: 'systolic' | 'diastolic'): DataPoint[] {
  return vitals
    .map((entry) => ({
      x: entry.datetime,
      y: which === 'systolic' ? entry.bloodPressure?.systolic || NaN : entry.bloodPressure?.diastolic || NaN
    }))
    .filter((point) => Number.isFinite(point.y));
}

function normalizeCoordinates(
  values: DataPoint[],
  width: number,
  height: number,
  padding: number
): NormalizedPoint[] {
  if (values.length === 0) return [];

  const ys = values.map((item) => item.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;

  return values.map((item, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((item.y - min) / range) * (height - padding * 2);

    return {
      x,
      y,
      raw: item
    };
  });
}

function pathFromCoordinates(points: NormalizedPoint[]): string {
  if (points.length === 0) return '';

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

function rangeLabel(range: DateRangeKey): string {
  if (range === '7d') return '7 Days';
  if (range === '30d') return '30 Days';
  if (range === '90d') return '3 Months';
  return 'Custom';
}

export default function PatientTrendsPage() {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [metric, setMetric] = useState<MetricKey>('bloodPressure');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vitals, setVitals] = useState<PortalVitalRecord[]>([]);

  const days = useMemo(() => {
    if (range === '7d') return 7;
    if (range === '30d') return 30;
    if (range === '90d') return 90;

    if (!customFrom || !customTo) {
      return 30;
    }

    const from = new Date(`${customFrom}T00:00:00`).getTime();
    const to = new Date(`${customTo}T23:59:59`).getTime();
    const span = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(365, Math.max(1, span || 30));
  }, [customFrom, customTo, range]);

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      try {
        const response = await getPatientTrends(days);
        if (cancelled) return;
        setVitals(response.vitals);
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

  const width = 980;
  const height = 380;
  const padding = 30;

  const normalizedMain = useMemo(
    () => normalizeCoordinates(points, width, height, padding),
    [height, points, width]
  );
  const normalizedSystolic = useMemo(
    () => normalizeCoordinates(systolicPoints, width, height, padding),
    [height, systolicPoints, width]
  );
  const normalizedDiastolic = useMemo(
    () => normalizeCoordinates(diastolicPoints, width, height, padding),
    [diastolicPoints, height, width]
  );

  const linePath = pathFromCoordinates(normalizedMain);
  const systolicPath = pathFromCoordinates(normalizedSystolic);
  const diastolicPath = pathFromCoordinates(normalizedDiastolic);

  const outlierCoordinates = useMemo(() => {
    if (!selectedMetric.range) return [];
    const [rangeMin, rangeMax] = selectedMetric.range;

    return normalizedMain.filter(
      (point) => point.raw.y < rangeMin || point.raw.y > rangeMax
    );
  }, [normalizedMain, selectedMetric.range]);

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
    () => vitals.filter((entry) => entry.riskLevel !== 'normal').slice(-6).reverse(),
    [vitals]
  );

  return (
    <section className="patient-page patient-trends-page">
      <header className="patient-page-head">
        <div>
          <h2>Health Trends</h2>
          <p>Visualize your health patterns over time</p>
        </div>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <section className="patient-trends-toolbar">
        <div className="patient-trends-metric-tabs">
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
        </div>

        <div className="patient-trends-range-tabs">
          <button
            type="button"
            className={`patient-tab-pill ${range === '7d' ? 'is-active' : ''}`}
            onClick={() => setRange('7d')}
          >
            7 Days
          </button>
          <button
            type="button"
            className={`patient-tab-pill ${range === '30d' ? 'is-active' : ''}`}
            onClick={() => setRange('30d')}
          >
            30 Days
          </button>
          <button
            type="button"
            className={`patient-tab-pill ${range === '90d' ? 'is-active' : ''}`}
            onClick={() => setRange('90d')}
          >
            3 Months
          </button>
          <button
            type="button"
            className={`patient-tab-pill ${range === 'custom' ? 'is-active' : ''}`}
            onClick={() => setRange('custom')}
          >
            Custom
          </button>
        </div>
      </section>

      {range === 'custom' ? (
        <section className="patient-trends-custom-range patient-card">
          <label>
            From
            <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
          </label>
        </section>
      ) : null}

      <article className="patient-card patient-trends-chart-card">
        <div className="patient-card-head">
          <h3>
            {selectedMetric.label} - Last {rangeLabel(range)}
          </h3>
          <button type="button" className="patient-secondary-button" onClick={() => window.print()}>
            Export Chart as PDF
          </button>
        </div>

        {loading ? (
          <p className="patient-page-status">Loading trend chart...</p>
        ) : (
          <svg className="patient-trend-chart" viewBox={`0 0 ${width} ${height}`}>
            <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
            {selectedMetric.range ? (
              <rect
                x={padding}
                y={height * 0.22}
                width={width - padding * 2}
                height={height * 0.32}
                fill="rgba(45, 196, 141, 0.12)"
              />
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

            {outlierCoordinates.map((point) => (
              <circle key={`${point.raw.x}-${point.raw.y}`} cx={point.x} cy={point.y} r="4" fill="#ef4444" />
            ))}
          </svg>
        )}
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

      {flaggedReadings.length > 0 ? (
        <article className="patient-card patient-flagged-card">
          <div className="patient-card-head">
            <h3>{flaggedReadings.length} Flagged Readings</h3>
            <Link to={ROUTE_PATHS.patient.vitals} className="patient-link-button">
              View in Vitals History
            </Link>
          </div>

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
        </article>
      ) : null}
    </section>
  );
}
