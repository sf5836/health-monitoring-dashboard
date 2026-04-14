
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../services/apiClient';
import publicService, { type PublicDoctor } from '../../services/publicService';

const specializations = ['Cardiologist', 'Neurologist', 'Diabetologist', 'Orthopedic', 'Eye Specialist', 'General Physician'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    publicService
      .getPublicDoctors()
      .then((items) => {
        if (!ignore) {
          setDoctors(items);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load doctors');
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
  }, []);

  const filteredDoctors = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return doctors;
    }
    return doctors.filter((doctor) => {
      const haystack = `${doctor.userId?.fullName || ''} ${doctor.specialization || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [doctors, search]);

  return (
    <div className="hm-doctors-page">
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
            <a href="#">About</a>
            <a href="#">Contact</a>
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

      <main className="hm-container hm-doctors-main">
        <section className="hm-doctors-head">
          <p className="hm-breadcrumb">Home {'>'} Doctors</p>
          <h1>Find Your Doctor</h1>
          <p>Search from verified specialists across multiple fields</p>
          <div className="hm-search">
            <span aria-hidden="true">🔎</span>
            <input
              type="search"
              placeholder="Search by name or specialization..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </section>

        <div className="hm-doctors-layout">
          <aside className="hm-filter-panel">
            <div className="hm-filter-head">
              <h2>Filters</h2>
              <button>Clear All</button>
            </div>

            <section className="hm-filter-block">
              <h3>Specialization</h3>
              <div className="hm-filter-list">
                {specializations.map((item) => (
                  <label key={item}>
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>
            </section>

            <section className="hm-filter-block">
              <h3>Minimum Rating</h3>
              <div className="hm-rating-pills">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className={star >= 4 ? 'active' : ''}>
                    {star}★
                  </button>
                ))}
              </div>
            </section>

            <section className="hm-filter-block">
              <h3>Consultation Fee</h3>
              <input type="range" min={500} max={5000} defaultValue={1600} />
              <p className="hm-filter-note">PKR 500 - PKR 5000</p>
            </section>

            <section className="hm-filter-block">
              <h3>Availability Day</h3>
              <div className="hm-day-pills">
                {days.map((day, idx) => (
                  <button key={day} className={idx < 3 ? 'active' : ''}>
                    {day}
                  </button>
                ))}
              </div>
            </section>

            <button className="hm-btn hm-btn-primary hm-btn-block">Apply Filters</button>
          </aside>

          <section className="hm-results-area">
            <div className="hm-results-topbar">
              <p>Showing {filteredDoctors.length} doctors</p>
              <label>
                Sort by
                <select>
                  <option>Rating</option>
                  <option>Experience</option>
                  <option>Fee: Low to High</option>
                  <option>Fee: High to Low</option>
                </select>
              </label>
            </div>

            <div className="hm-doctor-grid">
              {filteredDoctors.map((doctor) => (
                <article key={doctor._id} className="hm-doctor-result-card">
                  <div className="hm-doctor-avatar-wrap">
                    <div className="hm-avatar hm-doctor-avatar" />
                    <span className="hm-online-dot" />
                  </div>
                  <div className="hm-doctor-details">
                    <div className="hm-doctor-title">
                      <h3>{doctor.userId?.fullName || 'Doctor'}</h3>
                      <span className="hm-pill">{doctor.specialization || 'Specialist'}</span>
                    </div>
                    <p>{doctor.hospital || 'Hospital not listed'}</p>
                    <p>Experience: {doctor.experienceYears ?? 0} years</p>
                    <p className="hm-stars-row">{'★★★★★'} Verified specialist</p>
                    <p className="hm-fee">PKR {doctor.fee ?? 0} / consultation</p>
                    <div className="hm-doctor-actions">
                      <Link className="hm-btn hm-btn-outline" to={`/doctors/${doctor.userId?._id}`}>
                        View Profile
                      </Link>
                      <button className="hm-btn hm-btn-primary">Connect</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hm-pagination">
              <button>Previous</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <span>...</span>
              <button>8</button>
              <button>Next</button>
            </div>

            {loading ? <p>Loading doctors...</p> : null}
            {errorMessage ? <p>{errorMessage}</p> : null}
            {!loading && !errorMessage && filteredDoctors.length === 0 ? (
              <div className="hm-empty-state">
                <div className="hm-empty-icon" aria-hidden="true">
                  🩺
                </div>
                <p>No doctors found. Try another search term.</p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
