
import { Link } from 'react-router-dom';

const doctors = [
  { name: 'Dr. Sarah Ahmed', specialty: 'Cardiologist', rating: '4.9', exp: '12 years', fee: 'PKR 1,500/consult' },
  { name: 'Dr. Hamza Raza', specialty: 'Neurologist', rating: '4.8', exp: '10 years', fee: 'PKR 1,800/consult' },
  { name: 'Dr. Ayesha Malik', specialty: 'Diabetologist', rating: '4.7', exp: '9 years', fee: 'PKR 1,400/consult' }
];

const blogs = [
  {
    category: 'Cardiac Care',
    title: '7 Daily Habits That Protect Your Heart Health',
    author: 'Dr. Sarah Ahmed - Cardiologist',
    date: 'Apr 05, 2026',
    excerpt: 'Simple evidence-based routines you can add to your day to lower long-term cardiovascular risk.'
  },
  {
    category: 'Diabetes',
    title: 'Understanding Post-Meal Glucose Spikes',
    author: 'Dr. Ayesha Malik - Diabetologist',
    date: 'Apr 03, 2026',
    excerpt: 'Learn why glucose rises after meals and how to manage your plate for stable readings.'
  },
  {
    category: 'Prevention',
    title: 'How To Build a Reliable Home Vital Monitoring Routine',
    author: 'Dr. Hamza Raza - Neurologist',
    date: 'Mar 28, 2026',
    excerpt: 'A practical step-by-step approach for consistent vital tracking with meaningful trend insights.'
  }
];

const testimonials = [
  {
    name: 'Ahmed Khan',
    quote: 'I stopped guessing about my health. My trends and doctor feedback now keep me confident every day.'
  },
  {
    name: 'Fatima Ali',
    quote: 'The reminders, fast messaging, and clean dashboard helped me stay on top of my blood pressure goals.'
  },
  {
    name: 'Umar Sheikh',
    quote: 'Connecting with specialists was simple. I received guidance quickly and tracked progress week by week.'
  }
];

export default function HomePage() {
  return (
    <div className="hm-home">
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
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
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

      <section className="hm-hero">
        <div className="hm-container hm-hero-grid">
          <div className="hm-hero-copy">
            <p className="hm-kicker">Trusted Digital Health Platform</p>
            <h1>Monitor Your Health. Connect with Experts.</h1>
            <p>
              Log daily vitals, track trends, and get real-time guidance from certified doctors - all in one secure
              platform.
            </p>
            <div className="hm-hero-actions">
              <Link to="/register" className="hm-btn hm-btn-primary">
                Get Started Free
              </Link>
              <Link to="/doctors" className="hm-btn hm-btn-outline">
                Find a Doctor
              </Link>
            </div>
            <div className="hm-trust-badges">
              <span>256-bit Encrypted</span>
              <span>HIPAA Aligned</span>
              <span>Verified Doctors</span>
            </div>
          </div>

          <div className="hm-hero-mock">
            <div className="hm-mock-head">
              <h3>Health Snapshot</h3>
              <span>Today</span>
            </div>
            <div className="hm-mock-cards">
              <div className="hm-metric-card">
                <p>Blood Pressure</p>
                <h4>118 / 76</h4>
                <span className="ok">Normal</span>
              </div>
              <div className="hm-metric-card">
                <p>Heart Rate</p>
                <h4>72 bpm</h4>
                <span className="ok">Stable</span>
              </div>
            </div>
            <div className="hm-chart-fake">
              <div className="line" />
            </div>
          </div>
        </div>
      </section>

      <section className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head">
            <h2>Our Verified Specialists</h2>
            <p>Connect with certified doctors across multiple specializations</p>
            <Link to="/doctors" className="hm-btn hm-btn-outline">
              View All
            </Link>
          </div>

          <div className="hm-grid-3">
            {doctors.map((doctor) => (
              <article key={doctor.name} className="hm-card">
                <div className="hm-avatar" />
                <h3>{doctor.name}</h3>
                <span className="hm-pill">{doctor.specialty}</span>
                <p className="hm-meta">{'★★★★★'} {doctor.rating}</p>
                <p className="hm-meta">Experience: {doctor.exp}</p>
                <p className="hm-meta">Fee: {doctor.fee}</p>
                <Link to="/doctors" className="hm-btn hm-btn-outline hm-btn-block">
                  View Profile
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section hm-how">
        <div className="hm-container">
          <h2>How It Works</h2>
          <div className="hm-grid-3">
            <article className="hm-step-card">
              <div className="hm-step-no">1</div>
              <h3>Create Your Account</h3>
              <p>Register as a patient or doctor and complete your profile in minutes.</p>
            </article>
            <article className="hm-step-card">
              <div className="hm-step-no">2</div>
              <h3>Log Your Daily Vitals</h3>
              <p>Track blood pressure, glucose, heart rate, oxygen, and other key metrics.</p>
            </article>
            <article className="hm-step-card">
              <div className="hm-step-no">3</div>
              <h3>Get Expert Care</h3>
              <p>Doctors monitor trends, respond quickly, and prescribe digital treatment plans.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="hm-stats">
        <div className="hm-container hm-stats-grid">
          <div>
            <h2>10,000+</h2>
            <p>Patients</p>
          </div>
          <div>
            <h2>500+</h2>
            <p>Doctors</p>
          </div>
          <div>
            <h2>50,000+</h2>
            <p>Consultations</p>
          </div>
          <div>
            <h2>2,000+</h2>
            <p>Articles</p>
          </div>
        </div>
      </section>

      <section className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head hm-section-head-center">
            <h2>Featured Blogs</h2>
            <p>Insights from verified specialists to help you make informed daily health decisions.</p>
          </div>
          <div className="hm-grid-3">
            {blogs.map((blog) => (
              <article key={blog.title} className="hm-blog-card">
                <div className="hm-blog-cover" />
                <span className="hm-pill hm-pill-mint">{blog.category}</span>
                <h3>{blog.title}</h3>
                <p className="hm-meta">{blog.author}</p>
                <p className="hm-meta">{blog.date}</p>
                <p>{blog.excerpt}</p>
                <span className="hm-read-time">5 min read</span>
              </article>
            ))}
          </div>
          <div className="hm-section-cta">
            <Link to="/blogs" className="hm-btn hm-btn-outline">
              View All Articles
            </Link>
          </div>
        </div>
      </section>

      <section className="hm-section hm-testimonials" id="about">
        <div className="hm-container">
          <div className="hm-section-head hm-section-head-center">
            <h2>What Patients Say</h2>
          </div>
          <div className="hm-grid-3">
            {testimonials.map((item) => (
              <article key={item.name} className="hm-testimonial-card">
                <div className="hm-quote">"</div>
                <div className="hm-avatar hm-avatar-sm" />
                <h3>{item.name}</h3>
                <p className="hm-stars">★★★★★</p>
                <p>
                  <em>{item.quote}</em>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section hm-contact" id="contact">
        <div className="hm-container hm-contact-grid">
          <article className="hm-contact-card">
            <p className="hm-kicker">Contact HealthMonitor Pro</p>
            <h2>Talk to Our Care Team</h2>
            <p>
              Need help with appointments, doctor onboarding, or platform support? Our team is available throughout
              the week to help you quickly.
            </p>

            <div className="hm-contact-points">
              <div>
                <h3>Email Support</h3>
                <p>support@healthmonitorpro.local</p>
              </div>
              <div>
                <h3>Call Center</h3>
                <p>+92 300 0000000</p>
              </div>
              <div>
                <h3>Office Hours</h3>
                <p>Mon - Sat, 9:00 AM to 7:00 PM</p>
              </div>
              <div>
                <h3>Address</h3>
                <p>HealthMonitor Pro Tower, Lahore, Pakistan</p>
              </div>
            </div>
          </article>

          <article className="hm-contact-form-wrap">
            <h3>Send Us a Message</h3>
            <form className="hm-contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="hm-grid-2">
                <label>
                  Full Name
                  <input type="text" placeholder="Your name" required />
                </label>
                <label>
                  Phone Number
                  <input type="tel" placeholder="03xx xxxxxxx" required />
                </label>
              </div>
              <label>
                Email Address
                <input type="email" placeholder="you@example.com" required />
              </label>
              <label>
                Subject
                <select defaultValue="">
                  <option value="" disabled>
                    Select topic
                  </option>
                  <option>General Support</option>
                  <option>Doctor Registration</option>
                  <option>Appointments</option>
                  <option>Billing</option>
                </select>
              </label>
              <label>
                Message
                <textarea rows={5} placeholder="How can we help you?" required />
              </label>
              <button className="hm-btn hm-btn-primary" type="submit">
                Submit Request
              </button>
            </form>
          </article>
        </div>
      </section>

      <footer className="hm-footer">
        <div className="hm-container hm-footer-grid">
          <div>
            <h3>About HealthMonitor Pro</h3>
            <p>Secure digital health monitoring with trusted specialists and real-time clinical guidance.</p>
          </div>
          <div>
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/doctors">Doctors</Link></li>
              <li><Link to="/blogs">Blogs</Link></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3>Specializations</h3>
            <ul>
              <li>Cardiology</li>
              <li>Neurology</li>
              <li>Diabetology</li>
              <li>General Medicine</li>
            </ul>
          </div>
          <div>
            <h3>Newsletter</h3>
            <p>Stay Healthy - Subscribe for health tips</p>
            <div className="hm-newsletter">
              <input type="email" placeholder="Your email" />
              <button className="hm-btn hm-btn-primary">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="hm-footer-bottom">
          <p>Copyright 2026 HealthMonitor Pro</p>
          <p>Privacy Policy</p>
          <p>Terms of Service</p>
          <p>Socials: X | LinkedIn | YouTube</p>
        </div>
      </footer>
    </div>
  );
}
