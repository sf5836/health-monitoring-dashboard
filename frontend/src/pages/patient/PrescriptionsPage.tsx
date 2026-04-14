
import { useMemo, useState } from 'react';

type PrescriptionItem = {
  id: string;
  date: string;
  timestamp: number;
  doctor: string;
  specialization: string;
  diagnosis: string;
  followUp: string;
  instructions: string;
  medications: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
};

const navItems = [
  { icon: '🏠', label: 'Dashboard' },
  { icon: '📊', label: 'My Vitals' },
  { icon: '📈', label: 'Health Trends' },
  { icon: '👨‍⚕️', label: 'My Doctors' },
  { icon: '📅', label: 'Appointments' },
  { icon: '💊', label: 'Prescriptions', active: true },
  { icon: '💬', label: 'Messages', badge: '3' },
  { icon: '🔔', label: 'Notifications' },
];

const prescriptions: PrescriptionItem[] = [
  {
    id: 'rx-01',
    date: 'April 8, 2025',
    timestamp: 20250408,
    doctor: 'Dr. Sarah Ahmed',
    specialization: 'Cardiologist',
    diagnosis: 'Hypertension - Grade 1',
    followUp: 'April 22, 2025',
    instructions: 'Take with water. Avoid grapefruit juice. Monitor BP daily.',
    medications: [
      { medication: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
      { medication: 'Metoprolol', dosage: '25mg', frequency: 'Twice daily', duration: '30 days' },
      { medication: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days' },
    ],
  },
  {
    id: 'rx-02',
    date: 'March 30, 2025',
    timestamp: 20250330,
    doctor: 'Dr. Imran Malik',
    specialization: 'Diabetologist',
    diagnosis: 'Type 2 Diabetes - Controlled',
    followUp: 'April 18, 2025',
    instructions: 'Take after meals. Maintain fasting glucose log daily.',
    medications: [
      { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
      { medication: 'Sitagliptin', dosage: '100mg', frequency: 'Once daily', duration: '30 days' },
      { medication: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', duration: '45 days' },
    ],
  },
];

export default function PrescriptionsPage() {
  const [sortBy, setSortBy] = useState<'Latest' | 'Oldest'>('Latest');
  const [expandedIds, setExpandedIds] = useState<string[]>(['rx-01']);

  const sortedPrescriptions = useMemo(() => {
    return [...prescriptions].sort((a, b) => (sortBy === 'Latest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));
  }, [sortBy]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="hm-patient-dashboard hm-prescriptions-page">
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
          <p>Dashboard / Prescriptions</p>
          <h1>Good morning, Ahmed 👋</h1>
          <div>
            <button type="button" aria-label="Notifications">
              🔔 <em>5</em>
            </button>
            <span className="profile-chip">AK</span>
          </div>
        </header>

        <main className="hm-patient-main-content hm-prescriptions-content">
          <section className="hm-prescriptions-head">
            <div>
              <h2>My Prescriptions</h2>
              <p>View and download prescriptions from your doctors</p>
            </div>
            <label>
              Sort
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'Latest' | 'Oldest')}>
                <option value="Latest">Latest First</option>
                <option value="Oldest">Oldest First</option>
              </select>
            </label>
          </section>

          {sortedPrescriptions.length ? (
            <section className="hm-prescriptions-list">
              {sortedPrescriptions.map((item) => {
                const isExpanded = expandedIds.includes(item.id);
                return (
                  <article key={item.id} className="hm-prescription-card">
                    <header className="hm-prescription-card-head">
                      <div className="hm-prescription-doctor">
                        <div className="avatar small">DR</div>
                        <div>
                          <strong>{item.doctor}</strong>
                          <p>{item.specialization}</p>
                        </div>
                      </div>
                      <div className="hm-prescription-head-actions">
                        <small>{item.date}</small>
                        <button type="button" className="hm-btn hm-btn-outline hm-btn-small">
                          ⬇ Download PDF
                        </button>
                      </div>
                    </header>

                    <div className="hm-prescription-card-body">
                      <p className="hm-prescription-diagnosis">💊 Diagnosis: {item.diagnosis}</p>
                      <p className="hm-prescription-follow-up">
                        📅 Follow-up: <span>{item.followUp}</span>
                      </p>

                      <button type="button" className="hm-prescription-expand" onClick={() => toggleExpanded(item.id)}>
                        {item.medications.length} medications - Click to view <em>{isExpanded ? '▴' : '▾'}</em>
                      </button>

                      <div className={`hm-prescription-medication-wrap ${isExpanded ? 'expanded' : ''}`}>
                        <table>
                          <thead>
                            <tr>
                              <th>Medication</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.medications.map((medication) => (
                              <tr key={medication.medication}>
                                <td>{medication.medication}</td>
                                <td>{medication.dosage}</td>
                                <td>{medication.frequency}</td>
                                <td>{medication.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="hm-prescription-instructions">{item.instructions}</p>
                    </div>

                    <footer className="hm-prescription-card-foot">Prescribed by {item.doctor} - {item.date}</footer>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="hm-prescription-empty-state" aria-live="polite">
              <div className="hm-prescription-empty-icon">🧪</div>
              <h3>No prescriptions yet</h3>
              <p>Your doctor's prescriptions will appear here</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
