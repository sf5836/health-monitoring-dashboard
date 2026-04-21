import { useEffect, useState } from 'react';
import { getDoctorPrescriptions, type DoctorPrescription } from '../../services/doctorPortalService';
import { formatDate } from './doctorUi';

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPrescriptions() {
      try {
        const data = await getDoctorPrescriptions();
        if (cancelled) return;
        setPrescriptions(data);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load prescriptions right now.');
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

  if (loading) {
    return <p className="doctor-page-status">Loading prescriptions...</p>;
  }

  return (
    <section className="doctor-page">
      <header className="doctor-page-head">
        <div>
          <h2>Prescriptions</h2>
          <p>All prescriptions issued to your patients</p>
        </div>
      </header>

      {error ? <p className="doctor-error-banner">{error}</p> : null}

      <article className="doctor-card">
        {prescriptions.length === 0 ? (
          <p className="doctor-empty-state">No prescriptions available.</p>
        ) : (
          <ul className="doctor-prescription-list">
            {prescriptions.map((prescription) => (
              <li key={prescription.id} className="doctor-prescription-card">
                <header>
                  <p>{prescription.patientName}</p>
                  <small>{formatDate(prescription.issuedAt)}</small>
                </header>
                <p>{prescription.diagnosis || 'General care'}</p>
                <ul>
                  {prescription.medications.map((medication) => (
                    <li key={`${prescription.id}-${medication.name}`}>
                      {medication.name} {medication.dosage ? `- ${medication.dosage}` : ''}
                    </li>
                  ))}
                </ul>
                {prescription.pdfUrl ? (
                  <a href={prescription.pdfUrl} target="_blank" rel="noreferrer" className="doctor-link-button">
                    Download PDF
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
