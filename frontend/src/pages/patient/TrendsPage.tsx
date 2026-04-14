
import { useMemo, useState } from 'react';

type VitalType = 'Blood Pressure' | 'Heart Rate' | 'Blood Glucose' | 'Weight' | 'SpO2' | 'Temperature';
type RangeType = '7 Days' | '30 Days' | '3 Months' | 'Custom';

const vitals: VitalType[] = ['Blood Pressure', 'Heart Rate', 'Blood Glucose', 'Weight', 'SpO2', 'Temperature'];
const ranges: RangeType[] = ['7 Days', '30 Days', '3 Months', 'Custom'];

const navItems = [
  { icon: '🏠', label: 'Dashboard' },
  { icon: '📊', label: 'My Vitals' },
  { icon: '📈', label: 'Health Trends', active: true },
  { icon: '👨‍⚕️', label: 'My Doctors' },
  { icon: '📅', label: 'Appointments' },
  { icon: '💊', label: 'Prescriptions' },
  { icon: '💬', label: 'Messages', badge: '3' },
  { icon: '🔔', label: 'Notifications' },
];

export default function TrendsPage() {
  const [activeVital, setActiveVital] = useState<VitalType>('Blood Pressure');
  const [activeRange, setActiveRange] = useState<RangeType>('30 Days');

  const summary = useMemo(() => {
    if (activeVital === 'Blood Pressure') {
      return {
        min: '108/68 mmHg',
        max: '145/95 mmHg',
        avg: '121/79 mmHg',
        out: '3 readings',
      };
    }

    if (activeVital === 'Heart Rate') {
      return { min: '62 bpm', max: '108 bpm', avg: '74 bpm', out: '2 readings' };
    }

    if (activeVital === 'Blood Glucose') {
      return { min: '88 mg/dL', max: '168 mg/dL', avg: '112 mg/dL', out: '3 readings' };
    }

    if (activeVital === 'Weight') {
      return { min: '69.5 kg', max: '71.8 kg', avg: '70.4 kg', out: '0 readings' };
    }

    if (activeVital === 'SpO2') {
      return { min: '95%', max: '99%', avg: '97%', out: '1 reading' };
    }

    return { min: '36.3°C', max: '37.6°C', avg: '36.8°C', out: '2 readings' };
  }, [activeVital]);

  const flaggedReadings = [
    'Apr 8, 2025 - 145/95 mmHg - Hypertensive range',
    'Apr 4, 2025 - 141/93 mmHg - Elevated diastolic trend',
    'Mar 30, 2025 - 139/92 mmHg - Out-of-range evening reading',
  ];

  return (
    <div className="hm-patient-dashboard hm-trends-page">
      <aside className="hm-patient-sidebar">
        <div className="hm-patient-sidebar-top">
          <div className="hm-patient-logo">HM Pro</div>
          <button type="button" aria-label="Toggle navigation">
            ☰
          </button>
        </div>

        <nav className="hm-patient-nav">
          {navItems.map((item) => (
            <button key={item.label} type="button" className={item.active ? 'active' : ''}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              {item.badge ? <em>{item.badge}</em> : null}
            </button>
          ))}
        </nav>

        <div className="hm-patient-sidebar-user">
          <div className="avatar">AK</div>
          <div>
            <strong>Ahmed Khan</strong>
            <a href="#">View Profile</a>
          </div>
        </div>
      </aside>

      <div className="hm-patient-main-shell">
        <header className="hm-patient-topbar">
          <p>Dashboard / Health Trends</p>
          <h1>Good morning, Ahmed 👋</h1>
          <div>
            <button type="button" aria-label="Notifications">
              🔔 <em>5</em>
            </button>
            <span className="profile-chip">AK</span>
          </div>
        </header>

        <main className="hm-patient-main-content hm-trends-content">
          <section className="hm-trends-header">
            <h2>Health Trends</h2>
            <p>Visualize your health patterns over time</p>
          </section>

          <section className="hm-trends-toolbar">
            <div className="hm-trends-vitals-tabs">
              {vitals.map((vital) => (
                <button
                  key={vital}
                  type="button"
                  className={activeVital === vital ? 'active' : ''}
                  onClick={() => setActiveVital(vital)}
                >
                  {vital}
                </button>
              ))}
            </div>

            <div className="hm-trends-range-tabs">
              {ranges.map((range) => (
                <button
                  key={range}
                  type="button"
                  className={activeRange === range ? 'active' : ''}
                  onClick={() => setActiveRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </section>

          <section className="hm-trends-chart-card">
            <div className="hm-trends-chart-head">
              <h3>
                {activeVital} - Last {activeRange}
              </h3>
              <button type="button" className="hm-btn hm-btn-outline">
                Export Chart as PDF
              </button>
            </div>

            <div className="hm-trends-chart-area" role="img" aria-label={`${activeVital} trend chart`}>
              <div className="hm-chart-y-axis">
                <span>160</span>
                <span>140</span>
                <span>120</span>
                <span>100</span>
                <span>80</span>
              </div>

              <div className="hm-chart-canvas">
                <div className="hm-chart-normal-band" />
                <svg viewBox="0 0 720 360">
                  <polyline
                    points="18,268 98,244 174,260 255,214 334,228 414,184 494,203 572,170 654,188 706,163"
                    fill="none"
                    stroke="#1A9E72"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="18,306 98,286 174,300 255,262 334,276 414,246 494,260 572,236 654,248 706,226"
                    fill="none"
                    stroke="#14A0A0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="18,268 98,244 174,260 255,214 334,228 414,184 494,203 572,170 654,188 706,163 706,226 654,248 572,236 494,260 414,246 334,276 255,262 174,300 98,286 18,306"
                    fill="rgb(26 158 114 / 0.1)"
                  />
                  <circle cx="255" cy="214" r="7" fill="#ef4444" />
                  <circle cx="572" cy="170" r="7" fill="#ef4444" />
                  <circle cx="706" cy="163" r="7" fill="#ef4444" />
                </svg>

                <div className="hm-chart-tooltip">
                  <p>Apr 8, 2025</p>
                  <strong>145/95 mmHg</strong>
                  <span>High</span>
                </div>

                <div className="hm-chart-x-axis">
                  <span>Mar 14</span>
                  <span>Mar 20</span>
                  <span>Mar 26</span>
                  <span>Apr 1</span>
                  <span>Apr 8</span>
                </div>
              </div>
            </div>
          </section>

          <section className="hm-trends-summary-grid">
            <article>
              <p>Minimum</p>
              <strong>{summary.min}</strong>
            </article>
            <article>
              <p>Maximum</p>
              <strong className="critical">{summary.max}</strong>
            </article>
            <article>
              <p>Average</p>
              <strong>{summary.avg}</strong>
            </article>
            <article>
              <p>Out of Range</p>
              <strong className="warning">{summary.out}</strong>
            </article>
          </section>

          {summary.out !== '0 readings' ? (
            <section className="hm-trends-flagged-card">
              <h3>⚠️ 3 Flagged Readings</h3>
              <ul>
                {flaggedReadings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href="/patient/vitals">View in Vitals History</a>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
