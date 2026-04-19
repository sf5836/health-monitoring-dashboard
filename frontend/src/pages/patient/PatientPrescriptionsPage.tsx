import { useEffect, useState } from 'react';
import {
  getPatientPrescriptions,
  getPrescriptionPdfUrl,
  type PortalPrescription
} from '../../services/patientPortalService';
import { formatDate } from './patientUi';

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PortalPrescription[]>([]);
  const [expandedId, setExpandedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPrescriptions() {
      try {
        const result = await getPatientPrescriptions();
        if (cancelled) return;
        setPrescriptions(result);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load prescriptions.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPrescriptions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownload(prescriptionId: string) {
    try {
      const pdfUrl = await getPrescriptionPdfUrl(prescriptionId);
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Unable to download this prescription PDF.');
    }
  }

  return (
    <section className="patient-page">
      <header className="patient-page-head">
        <div>
          <h2>My Prescriptions</h2>
          <p>View and download prescriptions from your doctors.</p>
        </div>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}

      <article className="patient-card">
        {loading ? (
          <p className="patient-page-status">Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <p className="patient-empty-state">No prescriptions yet.</p>
        ) : (
          <ul className="patient-prescription-list">
            {prescriptions.map((prescription) => {
              const isExpanded = expandedId === prescription.id;
              return (
                <li key={prescription.id} className="patient-prescription-card">
                  <header>
                    <div>
                      <h3>{prescription.doctorName}</h3>
                      <p>{prescription.diagnosis || 'General follow-up care'}</p>
                    </div>
                    <div className="patient-inline-actions">
                      <small>{formatDate(prescription.issuedAt)}</small>
                      <button
                        type="button"
                        className="patient-link-button"
                        onClick={() => handleDownload(prescription.id)}
                      >
                        Download PDF
                      </button>
                    </div>
                  </header>

                  <button
                    type="button"
                    className="patient-link-button"
                    onClick={() => setExpandedId(isExpanded ? '' : prescription.id)}
                  >
                    {prescription.medications.length} medications {isExpanded ? 'Hide' : 'View'}
                  </button>

                  {isExpanded ? (
                    <div className="patient-table-wrap">
                      <table className="patient-table">
                        <thead>
                          <tr>
                            <th>Medication</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescription.medications.map((item, index) => (
                            <tr key={`${prescription.id}-med-${index}`}>
                              <td>{item.name}</td>
                              <td>{item.dosage || '-'}</td>
                              <td>{item.frequency || '-'}</td>
                              <td>{item.duration || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {prescription.instructions ? <p>{prescription.instructions}</p> : null}
                  {prescription.followUpDate ? <small>Follow-up: {formatDate(prescription.followUpDate)}</small> : null}
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
}
