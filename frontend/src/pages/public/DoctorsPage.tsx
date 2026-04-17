import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicDoctors } from '../../data/publicContent';
import { getPublicDoctors, type PublicDoctorCard } from '../../services/publicContentService';
import { ROUTE_PATHS } from '../../routes/routePaths';

function StarRow() {
  return (
    <div className="hm-star-row" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 24 24" className="hm-star" aria-hidden="true">
          <path d="M12 2.4l2.95 5.98 6.6.96-4.77 4.65 1.13 6.56L12 17.45l-5.91 3.1 1.13-6.56-4.77-4.65 6.6-.96L12 2.4z" />
        </svg>
      ))}
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<PublicDoctorCard[]>(
    publicDoctors.map((doctor, index) => ({
      id: String(index),
      name: doctor.name,
      specialization: doctor.specialization,
      experience: doctor.experience,
      fee: doctor.fee,
      rating: doctor.rating
    }))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const liveDoctors = await getPublicDoctors(60);
        if (!cancelled && liveDoctors.length > 0) {
          setDoctors(liveDoctors);
        }
      } catch {
        // Keep fallback content.
      }
    }

    loadDoctors();
    const intervalId = window.setInterval(loadDoctors, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="hm-page">
      <section className="section-shell hm-section hm-listing-head">
        <p className="hm-kicker">All Specialists</p>
        <h1>Our Verified Doctors</h1>
        <p className="hm-subtext">Browse all specialists available on HealthMonitor Pro.</p>
        <Link to={ROUTE_PATHS.public.home} className="hm-btn hm-btn-outline">
          Back to Home
        </Link>
      </section>

      <section className="section-shell hm-section hm-listing-section">
        <div className="hm-card-grid hm-card-grid-3">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="hm-card hm-doctor-card">
              <div className="hm-doctor-avatar" aria-hidden="true" />
              <h3>{doctor.name}</h3>
              <span className="hm-pill">{doctor.specialization}</span>
              <StarRow />
              <div className="hm-doctor-meta">
                <span>{doctor.experience}</span>
                <span>{doctor.fee}</span>
              </div>
              <button type="button" className="hm-btn hm-btn-outline hm-card-btn">
                View Profile
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
