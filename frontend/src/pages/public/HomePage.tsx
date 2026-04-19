
import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import {
  getPublicBlogs,
  getPublicDoctors,
  getPublicTestimonials,
  subscribeNewsletter,
  type PublicBlogCard,
  type PublicDoctorCard,
  type PublicTestimonialCard
} from '../../services/publicContentService';
import { ROUTE_PATHS } from '../../routes/routePaths';

const stats = [
  { value: '10,000+', label: 'Patients' },
  { value: '500+', label: 'Doctors' },
  { value: '50,000+', label: 'Consultations' },
  { value: '2,000+', label: 'Articles' }
];

const quickLinks = ['Home', 'Doctors', 'Blogs', 'About', 'Contact'];
const specializations = ['Cardiology', 'Endocrinology', 'General Medicine', 'Nutrition', 'Pulmonology'];

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

function StepArt({ kind }: Readonly<{ kind: 'account' | 'vitals' | 'care' }>) {
  return (
    <div className="hm-step-image-wrap" aria-hidden="true">
      <svg className="hm-step-art" viewBox="0 0 200 110">
        <rect x="10" y="12" width="180" height="86" rx="16" className="hm-step-frame" />
        <circle cx="34" cy="28" r="5" className="hm-step-dot" />
        <circle cx="48" cy="28" r="5" className="hm-step-dot" />
        <circle cx="62" cy="28" r="5" className="hm-step-dot" />

        {kind === 'account' && (
          <>
            <circle cx="62" cy="58" r="13" className="hm-step-fill" />
            <path d="M46 79c3-11 11-16 16-16s13 5 16 16" className="hm-step-stroke" />
            <rect x="98" y="49" width="74" height="10" rx="5" className="hm-step-light" />
            <rect x="98" y="67" width="52" height="10" rx="5" className="hm-step-light" />
            <path d="M156 74l7 7 15-16" className="hm-step-accent-stroke" />
          </>
        )}

        {kind === 'vitals' && (
          <>
            <rect x="28" y="52" width="145" height="30" rx="9" className="hm-step-light" />
            <path d="M36 68h20l8-11 11 21 11-27 10 20h14l9-14 9 11h34" className="hm-step-accent-stroke" />
            <rect x="28" y="37" width="50" height="8" rx="4" className="hm-step-fill" />
            <rect x="82" y="37" width="32" height="8" rx="4" className="hm-step-light" />
          </>
        )}

        {kind === 'care' && (
          <>
            <circle cx="58" cy="56" r="11" className="hm-step-fill" />
            <circle cx="124" cy="56" r="11" className="hm-step-fill" />
            <path d="M45 77c2-9 8-13 13-13s11 4 13 13" className="hm-step-stroke" />
            <path d="M111 77c2-9 8-13 13-13s11 4 13 13" className="hm-step-stroke" />
            <path d="M80 55h22" className="hm-step-stroke" />
            <path d="M159 46v8m-4-4h8" className="hm-step-accent-stroke" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function HomePage() {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [featuredDoctors, setFeaturedDoctors] = useState<PublicDoctorCard[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<PublicBlogCard[]>([]);
  const [testimonials, setTestimonials] = useState<PublicTestimonialCard[]>([]);
  const [liveDataError, setLiveDataError] = useState('');
  const [email, setEmail] = useState('');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [subscribeError, setSubscribeError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPublicData() {
      try {
        const [doctors, blogs, backendTestimonials] = await Promise.all([
          getPublicDoctors(6),
          getPublicBlogs(6),
          getPublicTestimonials(12)
        ]);
        if (!cancelled) {
          setFeaturedDoctors(doctors);
          setFeaturedBlogs(blogs);
          setTestimonials(backendTestimonials);
          setLiveDataError('');
        }
      } catch {
        if (!cancelled) {
          setFeaturedDoctors([]);
          setFeaturedBlogs([]);
          setTestimonials([]);
          setLiveDataError('Unable to load live backend data right now.');
        }
      }
    }

    loadPublicData();
    const refreshInterval = window.setInterval(loadPublicData, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, []);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setSubscribeError('Please enter your email.');
      setSubscribeMessage('');
      return;
    }

    setIsSubscribing(true);
    setSubscribeError('');
    setSubscribeMessage('');

    try {
      const message = await subscribeNewsletter(trimmedEmail);
      setSubscribeMessage(message);
      setEmail('');
    } catch (error) {
      setSubscribeError(error instanceof ApiError ? error.message : 'Subscription failed. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <div className="hm-page" id="home">
      <header className={`hm-header ${headerScrolled ? 'hm-header-scrolled' : ''}`}>
        <div className="hm-header-inner">
          <a href="#home" className="hm-brand" aria-label="HealthMonitor Pro home">
            <span className="hm-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 28 28">
                <path d="M14 24s-9-5.7-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.3-9 12-9 12z" />
                <path d="M6 14h4l2-3 2 6 2-4h6" />
              </svg>
            </span>
            <span className="hm-brand-text">HealthMonitor Pro</span>
          </a>

          <nav className="hm-nav" aria-label="Primary navigation">
            <a href="#home">Home</a>
            <a href="#doctors">Doctors</a>
            <a href="#blogs">Blogs</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
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

      <main>
        {liveDataError ? (
          <section className="section-shell" style={{ paddingTop: '1rem' }}>
            <p className="hm-subscribe-error">{liveDataError}</p>
          </section>
        ) : null}

        <section className="hm-hero section-shell">
          <div className="hm-hero-grid">
            <div className="hm-hero-copy">
              <p className="hm-kicker">Trusted digital care platform</p>
              <h1>Monitor Your Health. Connect with Experts.</h1>
              <p className="hm-subtext">
                Log daily vitals, track trends, and get real-time guidance from certified doctors
                all in one secure platform.
              </p>
              <div className="hm-cta-row">
                <Link to={ROUTE_PATHS.auth.register} className="hm-btn hm-btn-solid hm-btn-lg">
                  Get Started Free
                </Link>
                <a href="#doctors" className="hm-btn hm-btn-outline hm-btn-lg">
                  Find a Doctor
                </a>
              </div>
              <div className="hm-trust-badges" role="list" aria-label="Trust indicators">
                <span role="listitem">256-bit Encrypted</span>
                <span role="listitem">HIPAA Aligned</span>
                <span role="listitem">Verified Doctors</span>
              </div>
            </div>

            <div className="hm-dashboard-mockup" aria-label="Health dashboard illustration">
              <div className="hm-mockup-topbar" />
              <div className="hm-mockup-content">
                <div className="hm-metric-card">
                  <p>Heart Rate</p>
                  <strong>72 bpm</strong>
                  <span className="hm-up-trend">+3.1%</span>
                </div>
                <div className="hm-metric-card">
                  <p>Blood Pressure</p>
                  <strong>118/76</strong>
                  <span className="hm-stable">Stable</span>
                </div>
                <div className="hm-chart-card">
                  <p>Weekly Health Trend</p>
                  <div className="hm-chart-graph">
                    <svg viewBox="0 0 320 110" aria-label="analytics trend graph">
                      <defs>
                        <linearGradient id="hmGraphStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1a9e72" />
                          <stop offset="100%" stopColor="#2dc48d" />
                        </linearGradient>
                        <linearGradient id="hmGraphFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(45, 196, 141, 0.35)" />
                          <stop offset="100%" stopColor="rgba(45, 196, 141, 0)" />
                        </linearGradient>
                      </defs>
                      <path d="M20 92 L20 24 L304 24" className="hm-axis" />
                      <path
                        d="M20 80 C52 70, 74 66, 96 61 C122 55, 148 58, 174 48 C196 40, 220 30, 244 36 C266 42, 286 34, 304 26 L304 92 L20 92 Z"
                        fill="url(#hmGraphFill)"
                      />
                      <path
                        d="M20 80 C52 70, 74 66, 96 61 C122 55, 148 58, 174 48 C196 40, 220 30, 244 36 C266 42, 286 34, 304 26"
                        className="hm-trend-line"
                      />
                      <circle cx="96" cy="61" r="4" className="hm-trend-point" />
                      <circle cx="174" cy="48" r="4" className="hm-trend-point" />
                      <circle cx="244" cy="36" r="4" className="hm-trend-point" />
                      <circle cx="304" cy="26" r="4" className="hm-trend-point" />
                    </svg>
                    <div className="hm-graph-labels">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
                <div className="hm-summary-pill">Active Consultations: 04</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell hm-section" id="doctors">
          <div className="hm-section-heading">
            <h2>Our Verified Specialists</h2>
            <p>Connect with certified doctors across multiple specializations</p>
          </div>

          <div className="hm-card-grid hm-card-grid-3">
            {featuredDoctors.map((doctor) => (
              <article key={doctor.id} className="hm-card hm-doctor-card">
                <div className="hm-doctor-avatar" aria-hidden="true" />
                <h3>{doctor.name}</h3>
                <span className="hm-pill">{doctor.specialization}</span>
                <StarRow />
                <div className="hm-doctor-meta">
                  <span>{doctor.experience}</span>
                  <span>{doctor.fee}</span>
                </div>
                <Link
                  to={ROUTE_PATHS.public.doctors}
                  className="hm-btn hm-btn-outline hm-card-btn"
                  aria-label={`View ${doctor.name} profile`}
                >
                  View Profile
                </Link>
              </article>
            ))}
          </div>

          {featuredDoctors.length === 0 ? (
            <p className="hm-subtext" style={{ textAlign: 'center', marginTop: '1rem' }}>
              No doctors available yet.
            </p>
          ) : null}

          <div className="hm-section-action">
            <Link to={ROUTE_PATHS.public.doctors} className="hm-btn hm-btn-outline hm-btn-lg">
              View All
            </Link>
          </div>
        </section>

        <section className="hm-how-it-works" id="about">
          <div className="section-shell hm-section">
            <div className="hm-section-heading">
              <h2>How It Works</h2>
            </div>
            <div className="hm-step-grid">
              <article className="hm-step-card">
                <StepArt kind="account" />
                <span className="hm-step-number">1</span>
                <h3>Create Your Account</h3>
                <p>Register as patient or doctor and complete your secure onboarding in minutes.</p>
              </article>
              <article className="hm-step-card">
                <StepArt kind="vitals" />
                <span className="hm-step-number">2</span>
                <h3>Log Your Daily Vitals</h3>
                <p>Track blood pressure, glucose, heart rate, and other key indicators every day.</p>
              </article>
              <article className="hm-step-card">
                <StepArt kind="care" />
                <span className="hm-step-number">3</span>
                <h3>Get Expert Care</h3>
                <p>Doctors monitor your trends, provide guidance, and prescribe when needed.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="hm-stats-section">
          <div className="section-shell hm-stats-grid">
            {stats.map((stat) => (
              <article key={stat.label} className="hm-stat-card">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell hm-section" id="blogs">
          <div className="hm-section-heading">
            <h2>Featured Blogs</h2>
          </div>

          <div className="hm-card-grid hm-card-grid-3">
            {featuredBlogs.map((blog) => (
              <article key={blog.id} className="hm-card hm-blog-card">
                <div className="hm-blog-cover" aria-hidden="true" />
                <div className="hm-blog-content">
                  <span className="hm-pill">{blog.category}</span>
                  <h3>{blog.title}</h3>
                  <p className="hm-blog-meta">
                    {blog.author} | {blog.date}
                  </p>
                  <p className="hm-blog-excerpt">{blog.excerpt}</p>
                  <span className="hm-read-time">5 min read</span>
                </div>
              </article>
            ))}
          </div>

          {featuredBlogs.length === 0 ? (
            <p className="hm-subtext" style={{ textAlign: 'center', marginTop: '1rem' }}>
              No blog articles available yet.
            </p>
          ) : null}

          <div className="hm-section-action">
            <Link to={ROUTE_PATHS.public.blogs} className="hm-btn hm-btn-outline hm-btn-lg">
              View All Articles
            </Link>
          </div>
        </section>

        <section className="hm-testimonials">
          <div className="section-shell hm-section">
            <div className="hm-section-heading">
              <h2>What Patients Say</h2>
            </div>

            {testimonials.length > 0 ? (
              <div
                className="hm-testimonials-carousel"
                onMouseEnter={(e) => {
                  const container = e.currentTarget.querySelector('.hm-testimonials-container');
                  if (container) {
                    container.classList.add('paused');
                  }
                }}
                onMouseLeave={(e) => {
                  const container = e.currentTarget.querySelector('.hm-testimonials-container');
                  if (container) {
                    container.classList.remove('paused');
                  }
                }}
                role="region"
                aria-label="Patient testimonials carousel"
              >
                <div className="hm-testimonials-container">
                  {testimonials.map((testimonial) => (
                    <div key={`original-${testimonial.id}`} className="hm-testimonial-item">
                      <article className="hm-card hm-testimonial-card">
                        <span className="hm-quote-mark" aria-hidden="true">
                          &quot;
                        </span>
                        <div className="hm-testimonial-header">
                          <div className="hm-avatar" aria-hidden="true" />
                          <div>
                            <h3>{testimonial.name}</h3>
                            <p>{testimonial.role}</p>
                          </div>
                        </div>
                        <StarRow />
                        <p className="hm-quote">{testimonial.quote}</p>
                      </article>
                    </div>
                  ))}

                  {testimonials.map((testimonial) => (
                    <div key={`duplicate-${testimonial.id}`} className="hm-testimonial-item" aria-hidden="true">
                      <article className="hm-card hm-testimonial-card">
                        <span className="hm-quote-mark" aria-hidden="true">
                          &quot;
                        </span>
                        <div className="hm-testimonial-header">
                          <div className="hm-avatar" aria-hidden="true" />
                          <div>
                            <h3>{testimonial.name}</h3>
                            <p>{testimonial.role}</p>
                          </div>
                        </div>
                        <StarRow />
                        <p className="hm-quote">{testimonial.quote}</p>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="hm-subtext" style={{ textAlign: 'center', marginTop: '1rem' }}>
                No patient reviews available yet.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="hm-footer" id="contact">
        <div className="section-shell">
          <div className="hm-footer-grid">
            <section>
              <h3>About HealthMonitor Pro</h3>
              <p>
                A secure health monitoring platform helping patients and doctors stay connected with
                real-time insight, preventive care, and trusted clinical guidance.
              </p>
            </section>
            <section>
              <h3>Quick Links</h3>
              <ul>
                {quickLinks.map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase() === 'home' ? 'home' : link.toLowerCase()}`}>{link}</a>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Specializations</h3>
              <ul>
                {specializations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Contact</h3>
              <ul>
                <li>support@healthmonitorpro.com</li>
                <li>+92 300 0000000</li>
                <li>Lahore, Pakistan</li>
              </ul>
              <div className="hm-social-icons" aria-label="Social links">
                <a href="#" aria-label="Facebook">
                  f
                </a>
                <a href="#" aria-label="LinkedIn">
                  in
                </a>
                <a href="#" aria-label="X">
                  x
                </a>
              </div>
            </section>
          </div>

          <section className="hm-newsletter">
            <div>
              <h3>Stay Healthy - Subscribe for health tips</h3>
              <p>Get practical wellness guidance and preventive care insights every week.</p>
            </div>
            <form className="hm-newsletter-form" onSubmit={handleSubscribe}>
              <label htmlFor="hm-newsletter-email" className="hm-visually-hidden">
                Email address
              </label>
              <input
                id="hm-newsletter-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="submit" disabled={isSubscribing}>
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {subscribeMessage ? <p className="hm-subscribe-success">{subscribeMessage}</p> : null}
            {subscribeError ? <p className="hm-subscribe-error">{subscribeError}</p> : null}
          </section>

          <div className="hm-footer-bottom">
            <p>Copyright 2026 HealthMonitor Pro. All rights reserved.</p>
            <div>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
