import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getPublicDoctorById,
  getPublicDoctorReviews,
  type PublicDoctorDetail,
  type PublicDoctorReview
} from '../../services/publicContentService';
import { ROUTE_PATHS } from '../../routes/routePaths';

function fallbackDoctor(id = 'doctor'): PublicDoctorDetail {
  return {
    id,
    name: 'Doctor',
    specialization: 'General Medicine',
    experience: '0 years',
    experienceYears: 0,
    fee: 'PKR 0 / consultation',
    feeValue: 0,
    rating: 5,
    reviewsCount: 0,
    hospital: 'HealthMonitor Pro Partner Hospital',
    availability: 'Mon-Fri',
    bio: 'Doctor profile information will be available soon.',
    qualifications: []
  };
}

const DEFAULT_EXPERTISE = [
  'ECG Interpretation',
  'Angioplasty',
  'Heart Failure Management',
  'Holter Monitoring',
  'Echocardiography',
  'Stress Testing'
];

const DEFAULT_TAGS = ['Heart Disease', 'Hypertension', 'Cardiac Rehab'];

const LANGUAGES = ['English', 'Urdu', 'Punjabi'];

const QUALIFICATION_FALLBACK = [
  { degree: 'MBBS', institution: 'King Edward Medical University', year: '2012' },
  { degree: 'FCPS Cardiology', institution: 'College of Physicians and Surgeons Pakistan', year: '2018' }
];

function maskPatientName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Patient';
  const firstWord = trimmed.split(' ')[0];
  return `${firstWord.charAt(0).toUpperCase()}***`;
}

function extractQualifications(values: string[]) {
  if (!values.length) {
    return QUALIFICATION_FALLBACK;
  }

  return values.map((value) => {
    const parts = value
      .split('-')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 3) {
      return {
        degree: parts[0],
        institution: parts[1],
        year: parts[2]
      };
    }

    return {
      degree: value,
      institution: 'Institution details available on request',
      year: 'N/A'
    };
  });
}

function reviewBreakdown(totalReviews: number, average: number) {
  const ratios = average >= 4.5
    ? [0.03, 0.04, 0.08, 0.25, 0.6]
    : average >= 4
      ? [0.05, 0.08, 0.12, 0.3, 0.45]
      : [0.08, 0.12, 0.2, 0.28, 0.32];

  const counts = ratios.map((ratio) => Math.round(totalReviews * ratio));
  const diff = totalReviews - counts.reduce((sum, value) => sum + value, 0);
  counts[counts.length - 1] += diff;

  return [5, 4, 3, 2, 1].map((star, index) => ({
    star,
    count: Math.max(counts[4 - index], 0),
    pct: Math.max(Math.round(((counts[4 - index] || 0) / Math.max(totalReviews, 1)) * 100), 0)
  }));
}

export default function DoctorDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [doctor, setDoctor] = useState<PublicDoctorDetail>(fallbackDoctor(id));
  const [reviews, setReviews] = useState<PublicDoctorReview[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'qualifications' | 'reviews' | 'availability' | 'blogs'>('about');
  const [consultationType, setConsultationType] = useState<'in-person' | 'teleconsult'>('in-person');
  const [consultationDate, setConsultationDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctor() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [details, doctorReviews] = await Promise.all([
          getPublicDoctorById(id),
          getPublicDoctorReviews(id, 12)
        ]);

        if (!cancelled) {
          setDoctor(details);
          setReviews(doctorReviews);
          setError('');
        }
      } catch {
        if (!cancelled) {
          setDoctor(fallbackDoctor(id));
          setReviews([]);
          setError('Unable to load real-time doctor details right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDoctor();
    const refreshId = window.setInterval(loadDoctor, 45000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshId);
    };
  }, [id]);

  const sectionIds = {
    about: 'doctor-about',
    qualifications: 'doctor-qualifications',
    reviews: 'doctor-reviews',
    availability: 'doctor-availability',
    blogs: 'doctor-blogs'
  } as const;

  const tags = useMemo(() => {
    if (doctor.specialization.toLowerCase().includes('cardio')) {
      return ['Heart Disease', 'Hypertension', 'Cardiac Rehab'];
    }
    return DEFAULT_TAGS;
  }, [doctor.specialization]);

  const qualifications = useMemo(() => extractQualifications(doctor.qualifications), [doctor.qualifications]);

  const totalReviewCount = Math.max(doctor.reviewsCount, reviews.length, 1);
  const ratingRows = useMemo(() => reviewBreakdown(totalReviewCount, doctor.rating), [doctor.rating, totalReviewCount]);

  function scrollToSection(tab: keyof typeof sectionIds) {
    setActiveTab(tab);
    const element = document.getElementById(sectionIds[tab]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleConnect() {
    navigate(ROUTE_PATHS.auth.login);
  }

  function handleBookAppointment() {
    navigate(ROUTE_PATHS.auth.login);
  }

  function handleCheckAvailability() {
    if (!consultationDate) {
      setError('Select a consultation date before checking availability.');
      return;
    }
    setError('');
    navigate(ROUTE_PATHS.auth.login);
  }

  return (
    <main className="hm-page hm-doctor-detail-page">
      <header className="hm-header hm-header-scrolled" role="banner">
        <div className="hm-header-inner">
          <Link to={ROUTE_PATHS.public.home} className="hm-brand" aria-label="HealthMonitor Pro home">
            <span className="hm-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 12h3.4l2-3.8 3.2 7.3 2.4-4.5H21" />
                <path d="M12 21a8.7 8.7 0 0 1-6.2-2.6A8.6 8.6 0 0 1 3.2 12 8.8 8.8 0 0 1 12 3.2 8.8 8.8 0 0 1 20.8 12" />
              </svg>
            </span>
            <span className="hm-brand-text">HealthMonitor Pro</span>
          </Link>

          <nav className="hm-nav" aria-label="Primary navigation">
            <Link to={ROUTE_PATHS.public.home}>Home</Link>
            <Link to={ROUTE_PATHS.public.doctors}>Doctors</Link>
            <Link to={ROUTE_PATHS.public.blogs}>Blogs</Link>
            <Link to={`${ROUTE_PATHS.public.home}#about`}>About</Link>
            <Link to={`${ROUTE_PATHS.public.home}#contact`}>Contact</Link>
          </nav>

          <div className="hm-auth-actions">
            <Link to={ROUTE_PATHS.auth.login} className="hm-btn hm-btn-outline">
              Login
            </Link>
            <Link to={ROUTE_PATHS.auth.register} className="hm-btn hm-btn-solid">
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="section-shell hm-doctor-detail-wrap">
        <Link to={ROUTE_PATHS.public.doctors} className="hm-back-link">
          ← Back to Doctors
        </Link>

        {error ? <p className="hm-doctor-error">{error}</p> : null}

        <article className="hm-doctor-hero-card">
          <div className="hm-doctor-hero-top">
            <div className="hm-doctor-photo-col">
              <div className="hm-doctor-photo" aria-hidden="true" />
              <span className="hm-verified-badge">Verified</span>
            </div>

            <div className="hm-doctor-hero-main">
              {loading ? <h1>Loading doctor profile...</h1> : <h1>{doctor.name}</h1>}
              <span className="hm-pill">{doctor.specialization}</span>
              <p className="hm-doctor-hospital">{doctor.hospital}</p>

              <p className="hm-doctor-stats-row">
                <span>★ {doctor.rating.toFixed(1)} ({Math.max(doctor.reviewsCount, reviews.length)} reviews)</span>
                <span>{doctor.experience}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{doctor.feeValue.toLocaleString()} PKR/consult</span>
              </p>

              <p className="hm-doctor-availability-badge">
                <span className="hm-status-dot" aria-hidden="true" />
                Available Today
              </p>

              <div className="hm-result-actions hm-doctor-hero-actions">
                <button type="button" className="hm-btn hm-btn-solid" onClick={handleConnect}>
                  Connect as Patient
                </button>
                <button type="button" className="hm-btn hm-btn-outline" onClick={handleBookAppointment}>
                  Book Appointment
                </button>
              </div>
            </div>
          </div>

          <div className="hm-doctor-tag-strip" role="list" aria-label="Doctor specialties">
            {tags.map((tag) => (
              <span key={tag} role="listitem" className="hm-doctor-tag">
                {tag}
              </span>
            ))}
          </div>
        </article>

        <nav className="hm-doctor-tabs" aria-label="Doctor profile sections">
          {(['about', 'qualifications', 'reviews', 'availability', 'blogs'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => scrollToSection(tab)}
            >
              {tab === 'about' ? 'About' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <section id="doctor-about" className="hm-doctor-main-grid">
          <div className="hm-doctor-main-col">
            <article className="hm-doctor-panel">
              <h2>About {doctor.name}</h2>
              <p>{doctor.bio}</p>

              <h3>Languages</h3>
              <div className="hm-inline-badges">
                {LANGUAGES.map((language) => (
                  <span key={language}>{language}</span>
                ))}
              </div>

              <h3>Areas of Expertise</h3>
              <div className="hm-expertise-grid">
                {DEFAULT_EXPERTISE.map((expertise) => (
                  <span key={expertise}>{expertise}</span>
                ))}
              </div>
            </article>

            <article id="doctor-qualifications" className="hm-doctor-panel">
              <h2>Qualifications</h2>
              <ul className="hm-qualification-timeline">
                {qualifications.map((item, index) => (
                  <li key={`${item.degree}-${index}`}>
                    <span className="hm-qualification-dot" aria-hidden="true" />
                    <div>
                      <h3>{item.degree}</h3>
                      <p>{item.institution}</p>
                    </div>
                    <strong>{item.year}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article id="doctor-reviews" className="hm-doctor-panel">
              <h2>Patient Reviews</h2>
              <div className="hm-review-overview">
                <div className="hm-review-score">
                  <strong>{doctor.rating.toFixed(1)}</strong>
                  <p>{Math.max(doctor.reviewsCount, reviews.length)} reviews</p>
                </div>

                <div className="hm-review-bars" aria-label="Rating distribution">
                  {ratingRows.map((row) => (
                    <div key={row.star} className="hm-review-bar-row">
                      <span>{row.star}★</span>
                      <div>
                        <i style={{ width: `${row.pct}%` }} />
                      </div>
                      <span>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hm-review-card-list">
                {reviews.slice(0, 3).map((review) => (
                  <article key={review.id} className="hm-review-card">
                    <div className="hm-review-head">
                      <span className="hm-avatar" aria-hidden="true" />
                      <div>
                        <h4>{maskPatientName(review.name)}</h4>
                        <p>{review.date}</p>
                      </div>
                      <span className="hm-review-stars">★★★★★</span>
                    </div>
                    <p>{review.quote}</p>
                  </article>
                ))}
                {reviews.length === 0 ? (
                  <p className="hm-subtext">No review comments available yet for this doctor.</p>
                ) : null}
              </div>
            </article>

            <article id="doctor-availability" className="hm-doctor-panel">
              <h2>Availability</h2>
              <p>{doctor.availability}</p>
            </article>

            <article id="doctor-blogs" className="hm-doctor-panel">
              <h2>Blogs</h2>
              <p>Articles by {doctor.name} will appear here after publication.</p>
              <Link to={ROUTE_PATHS.public.blogs} className="hm-btn hm-btn-outline" style={{ marginTop: '1rem' }}>
                View All Blogs
              </Link>
            </article>
          </div>

          <aside className="hm-doctor-side-col">
            <article className="hm-doctor-side-card">
              <h3>Quick Info</h3>
              <p><strong>Phone:</strong> +92 300 1234567</p>
              <p><strong>Email:</strong> doctor@healthmonitor.pro</p>
              <p><strong>Response:</strong> Usually within 2 hours</p>
            </article>

            <article className="hm-doctor-side-card hm-doctor-side-card-accent">
              <h3>Book a Consultation</h3>
              <div className="hm-consult-type">
                <label>
                  <input
                    type="radio"
                    name="consultType"
                    checked={consultationType === 'in-person'}
                    onChange={() => setConsultationType('in-person')}
                  />
                  In-person
                </label>
                <label>
                  <input
                    type="radio"
                    name="consultType"
                    checked={consultationType === 'teleconsult'}
                    onChange={() => setConsultationType('teleconsult')}
                  />
                  Teleconsult
                </label>
              </div>
              <input
                type="date"
                value={consultationDate}
                onChange={(event) => setConsultationDate(event.target.value)}
              />
              <button type="button" className="hm-btn hm-btn-solid" onClick={handleCheckAvailability}>
                Check Availability
              </button>
            </article>

            <article className="hm-doctor-side-card">
              <h3>Connect as Patient</h3>
              <p>Get personalized guidance by connecting with this specialist through your patient account.</p>
              <button type="button" className="hm-btn hm-btn-solid" onClick={handleConnect}>
                Connect as Patient
              </button>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
