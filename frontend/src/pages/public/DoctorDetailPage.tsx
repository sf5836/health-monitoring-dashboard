
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import publicService, { type PublicDoctor } from '../../services/publicService';

const expertise = [
  'Heart Disease Management',
  'Hypertension Care',
  'Cardiac Rehab',
  'Preventive Cardiology',
  'ECG Interpretation',
  'Lifestyle Coaching'
];

const qualifications = [
  { degree: 'MBBS', institution: 'King Edward Medical University', year: '2010' },
  { degree: 'FCPS Cardiology', institution: 'College of Physicians and Surgeons Pakistan', year: '2015' },
  { degree: 'Fellowship in Preventive Cardiology', institution: 'Royal Heart Institute', year: '2018' }
];

const reviews = [
  {
    name: 'Patient A.',
    date: 'Apr 08, 2026',
    text: 'Excellent communication and very clear guidance on medication and lifestyle changes.'
  },
  {
    name: 'Patient B.',
    date: 'Apr 02, 2026',
    text: 'She reviewed my trends carefully and adjusted treatment quickly. Highly recommended.'
  },
  {
    name: 'Patient C.',
    date: 'Mar 24, 2026',
    text: 'Professional, empathetic, and very responsive. The follow-up plan was easy to follow.'
  }
];

export default function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<PublicDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErrorMessage('Doctor id is missing');
      return;
    }

    let ignore = false;
    publicService
      .getPublicDoctorById(id)
      .then((item) => {
        if (!ignore) {
          setDoctor(item);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load doctor');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="placeholder-page">
        <h2>Doctor Profile</h2>
        <p>Loading doctor details...</p>
      </section>
    );
  }

  if (errorMessage || !doctor) {
    return (
      <section className="placeholder-page">
        <h2>Doctor Profile</h2>
        <p>{errorMessage || 'Doctor not found'}</p>
        <Link to="/doctors">Back to doctors</Link>
      </section>
    );
  }

  return (
    <div className="hm-doctor-profile-page">
      <header className="hm-header">
        <div className="hm-container hm-header-inner">
          <div className="hm-brand">
            <span className="hm-heart">+</span>
            <span>HealthMonitor Pro</span>
          </div>
          <nav className="hm-nav">
            <Link to="/">Home</Link>
            <Link to="/doctors">Doctors</Link>
            <Link to="/blogs">Blogs</Link>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
          </nav>
          <div className="hm-auth-actions">
            <Link to="/login" className="hm-btn hm-btn-outline">
              Login
            </Link>
            <Link to="/register" className="hm-btn hm-btn-primary">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="hm-container hm-doctor-profile-main">
        <section className="hm-doctor-hero-card">
          <div className="hm-doctor-hero-top">
            <div className="hm-doctor-hero-photo-block">
              <div className="hm-avatar hm-doctor-hero-avatar" />
              <span className="hm-doctor-verified">Verified</span>
            </div>

            <div className="hm-doctor-hero-copy">
              <h1>{doctor.userId?.fullName || 'Doctor Profile'}</h1>
              <span className="hm-pill">{doctor.specialization || 'Specialist'}</span>
              <p>{doctor.hospital || 'Hospital not listed'}</p>
              <div className="hm-doctor-stats-line">
                <span>★ Verified specialist</span>
                <span>{doctor.experienceYears ?? 0} years experience</span>
                <span>PKR {doctor.fee ?? 0}/consult</span>
              </div>
              <span className="hm-available-badge">
                <span className="dot" /> Available Today
              </span>
              <div className="hm-doctor-hero-actions">
                <Link to="/login" className="hm-btn hm-btn-primary">
                  Connect as Patient
                </Link>
                <Link to="/login" className="hm-btn hm-btn-outline">
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>

          <div className="hm-tag-strip">
            <span>Heart Disease</span>
            <span>Hypertension</span>
            <span>Cardiac Rehab</span>
          </div>
        </section>

        <nav className="hm-profile-tabs">
          <button className="active">About</button>
          <button>Qualifications</button>
          <button>Reviews</button>
          <button>Availability</button>
          <button>Blogs</button>
        </nav>

        <section className="hm-profile-about-layout">
          <article className="hm-about-main-card">
            <h2>About {doctor.userId?.fullName || 'Doctor'}</h2>
            <p>{doctor.bio || 'No biography available for this doctor yet.'}</p>

            <h3>Languages</h3>
            <div className="hm-language-pills">
              <span>English</span>
              <span>Urdu</span>
              <span>Punjabi</span>
            </div>

            <h3>Areas of Expertise</h3>
            <div className="hm-expertise-grid">
              {expertise.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <aside className="hm-about-sidebar">
            <section className="hm-info-card">
              <h3>Quick Info</h3>
              <p>Phone: +92 300 1234567</p>
              <p>Email: doctor.profile@healthmonitorpro.com</p>
              <p>Response time: Usually within 2 hours</p>
            </section>

            <section className="hm-book-card">
              <h3>Book a Consultation</h3>
              <label>
                <input type="radio" name="type" defaultChecked /> In-person
              </label>
              <label>
                <input type="radio" name="type" /> Teleconsult
              </label>
              <input type="date" />
              <Link to="/login" className="hm-btn hm-btn-primary hm-btn-block">
                Check Availability
              </Link>
            </section>

            <section className="hm-connect-card">
              <h3>Connect as Patient</h3>
              <p>Securely connect for trend review, care plans, and digital follow-ups.</p>
              <Link to="/login" className="hm-btn hm-btn-primary hm-btn-block">
                Connect Now
              </Link>
            </section>
          </aside>
        </section>

        <section className="hm-profile-section-card">
          <h2>Qualifications</h2>
          <div className="hm-qualification-timeline">
            {qualifications.map((item) => (
              <div key={item.degree} className="hm-timeline-row">
                <span className="hm-timeline-dot" />
                <div>
                  <h3>{item.degree}</h3>
                  <p>{item.institution}</p>
                </div>
                <strong>{item.year}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="hm-profile-section-card">
          <h2>Reviews</h2>
          <div className="hm-reviews-summary">
            <div className="hm-rating-big">4.8</div>
            <div className="hm-rating-bars">
              <div><span>5★</span><progress max="100" value="78" /><span>78%</span></div>
              <div><span>4★</span><progress max="100" value="17" /><span>17%</span></div>
              <div><span>3★</span><progress max="100" value="4" /><span>4%</span></div>
              <div><span>2★</span><progress max="100" value="1" /><span>1%</span></div>
            </div>
          </div>

          <div className="hm-profile-reviews-grid">
            {reviews.map((review) => (
              <article key={review.name + review.date} className="hm-review-card">
                <div className="hm-avatar hm-avatar-sm" />
                <h3>{review.name}</h3>
                <p className="hm-stars">★★★★★</p>
                <p className="hm-meta">{review.date}</p>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
