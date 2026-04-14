
import { useMemo, useState } from 'react';

const navItems = [
  { icon: '🏠', label: 'Dashboard' },
  { icon: '📊', label: 'My Vitals', active: true },
  { icon: '📈', label: 'Health Trends' },
  { icon: '👨‍⚕️', label: 'My Doctors' },
  { icon: '📅', label: 'Appointments' },
  { icon: '💊', label: 'Prescriptions' },
  { icon: '💬', label: 'Messages', badge: '3' },
  { icon: '🔔', label: 'Notifications' },
];

const historyRows = [
  {
    dateTime: 'Apr 9, 2025 8:30 AM',
    bp: '118/76 mmHg',
    hr: '72 bpm',
    spo2: '98%',
    glucose: '104 mg/dL',
    weight: '70 kg',
    temp: '36.8°C',
    risk: 'Normal',
  },
  {
    dateTime: 'Apr 8, 2025 9:05 AM',
    bp: '145/95 mmHg',
    hr: '98 bpm',
    spo2: '95%',
    glucose: '168 mg/dL',
    weight: '71 kg',
    temp: '37.4°C',
    risk: 'High',
  },
  {
    dateTime: 'Apr 7, 2025 8:40 AM',
    bp: '126/84 mmHg',
    hr: '82 bpm',
    spo2: '97%',
    glucose: '129 mg/dL',
    weight: '70 kg',
    temp: '36.9°C',
    risk: 'Medium',
  },
  {
    dateTime: 'Apr 6, 2025 8:10 AM',
    bp: '120/80 mmHg',
    hr: '74 bpm',
    spo2: '98%',
    glucose: '108 mg/dL',
    weight: '70 kg',
    temp: '36.7°C',
    risk: 'Normal',
  },
];

type GlucoseMode = 'Fasting' | 'Post-meal' | 'Random';

export default function VitalsPage() {
  const [glucoseMode, setGlucoseMode] = useState<GlucoseMode>('Fasting');
  const [dateTime, setDateTime] = useState(() => new Date().toISOString().slice(0, 16));

  const glucoseHint = useMemo(() => {
    if (glucoseMode === 'Fasting') {
      return 'Normal fasting range: 70-100 mg/dL';
    }

    if (glucoseMode === 'Post-meal') {
      return 'Target post-meal range: below 140 mg/dL';
    }

    return 'Random glucose is usually evaluated with clinical context.';
  }, [glucoseMode]);

  return (
    <div className="hm-patient-dashboard hm-vitals-page">
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
          <p>Dashboard / My Vitals</p>
          <h1>Good morning, Ahmed 👋</h1>
          <div>
            <button type="button" aria-label="Notifications">
              🔔 <em>5</em>
            </button>
            <span className="profile-chip">AK</span>
          </div>
        </header>

        <main className="hm-patient-main-content hm-vitals-content">
          <section className="hm-vitals-header">
            <div>
              <h2>Log Your Vitals</h2>
              <p>Track your daily health metrics</p>
            </div>

            <div className="hm-vitals-header-actions">
              <button type="button" className="hm-btn hm-btn-outline">
                Export as PDF
              </button>
              <label>
                Filter by Date
                <input type="date" />
              </label>
            </div>
          </section>

          <section className="hm-vitals-form-card">
            <div className="hm-vitals-card-head">
              <h3>New Entry</h3>
              <p>Today, April 10, 2025</p>
            </div>

            <form className="hm-vitals-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                Date &amp; Time
                <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
              </label>

              <div className="hm-vitals-grid-two">
                <label>
                  💗 Blood Pressure
                  <div className="hm-bp-row">
                    <input type="number" placeholder="Systolic mmHg" />
                    <input type="number" placeholder="Diastolic mmHg" />
                  </div>
                  <small>Normal: 90-120 / 60-80 mmHg</small>
                </label>

                <label>
                  Heart Rate
                  <input type="number" placeholder="Heart Rate (bpm)" />
                  <small>Normal: 60-100 bpm</small>
                </label>
              </div>

              <div className="hm-vitals-grid-two">
                <label>
                  Oxygen Level (SpO2 %)
                  <input type="number" placeholder="SpO2 %" />
                  <small>Normal: 95-100%</small>
                </label>

                <label>
                  Temperature (°C)
                  <input type="number" placeholder="Temperature (°C)" />
                  <small>Normal: 36.1-37.2°C</small>
                </label>
              </div>

              <div className="hm-vitals-grid-two">
                <label>
                  Blood Glucose (mg/dL)
                  <input type="number" placeholder="Blood Glucose" />
                  <div className="hm-glucose-modes">
                    {(['Fasting', 'Post-meal', 'Random'] as GlucoseMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={glucoseMode === mode ? 'active' : ''}
                        onClick={() => setGlucoseMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <small>{glucoseHint}</small>
                </label>

                <label>
                  Weight (kg)
                  <input type="number" placeholder="Weight (kg)" />
                </label>
              </div>

              <label>
                Notes (optional)
                <textarea rows={4} placeholder="Add notes about symptoms, meals, or activities..." />
              </label>

              <button type="submit" className="hm-btn hm-btn-primary hm-btn-block">
                Save Vital Entry
              </button>
            </form>
          </section>

          <section className="hm-vitals-history-card">
            <div className="hm-vitals-card-head">
              <h3>History</h3>
              <p>48 entries</p>
            </div>

            <div className="hm-vitals-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date &amp; Time ↕</th>
                    <th>Blood Pressure ↕</th>
                    <th>Heart Rate ↕</th>
                    <th>SpO2 ↕</th>
                    <th>Glucose ↕</th>
                    <th>Weight ↕</th>
                    <th>Temp ↕</th>
                    <th>Risk ↕</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.dateTime}>
                      <td>{row.dateTime}</td>
                      <td>{row.bp}</td>
                      <td>{row.hr}</td>
                      <td>{row.spo2}</td>
                      <td>{row.glucose}</td>
                      <td>{row.weight}</td>
                      <td>{row.temp}</td>
                      <td>
                        <span className={`hm-risk-pill ${row.risk.toLowerCase()}`}>{row.risk}</span>
                      </td>
                      <td>
                        <div className="hm-table-actions">
                          <button type="button" aria-label="Edit entry">
                            ✏️
                          </button>
                          <button type="button" aria-label="Delete entry">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hm-vitals-pagination">
              <button type="button">Previous</button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">4</button>
              <button type="button">Next</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
