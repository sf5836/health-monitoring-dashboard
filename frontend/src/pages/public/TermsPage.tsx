import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { getSessionDashboardRoute, isSessionActive } from '../../services/authSession';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'eligibility', title: 'Eligibility & Account Registration' },
  { id: 'patient-responsibilities', title: 'Patient Responsibilities' },
  { id: 'doctor-responsibilities', title: 'Doctor Responsibilities & Verification' },
  { id: 'medical-disclaimer', title: 'Medical Disclaimer' },
  { id: 'prohibited-uses', title: 'Prohibited Uses' },
  { id: 'appointments', title: 'Appointments & Cancellations' },
  { id: 'payments', title: 'Payments & Fees' },
  { id: 'content', title: 'Content & Intellectual Property' },
  { id: 'termination', title: 'Termination' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'changes', title: 'Changes to These Terms' },
  { id: 'contact-us', title: 'Contact Us' }
];

function Brand() {
  return (
    <Link to={ROUTE_PATHS.public.home} className="hm-brand" aria-label="HealthMonitor Pro home">
      <span className="hm-brand-icon" aria-hidden="true">
        <svg viewBox="0 0 28 28">
          <path d="M14 24s-9-5.7-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.3-9 12-9 12z" />
          <path d="M6 14h4l2-3 2 6 2-4h6" />
        </svg>
      </span>
      <span className="hm-brand-text">HealthMonitor Pro</span>
    </Link>
  );
}

function LegalFooter() {
  return (
    <footer className="hm-footer">
      <div className="section-shell">
        <div className="hm-footer-grid">
          <section>
            <h3>About HealthMonitor Pro</h3>
            <p>A secure health monitoring platform helping patients and doctors stay connected with real-time insight and trusted clinical guidance.</p>
          </section>
          <section>
            <h3>Quick Links</h3>
            <ul>
              <li><Link to={ROUTE_PATHS.public.home}>Home</Link></li>
              <li><Link to={ROUTE_PATHS.public.doctors}>Doctors</Link></li>
              <li><Link to={ROUTE_PATHS.public.blogs}>Blogs</Link></li>
            </ul>
          </section>
          <section>
            <h3>Resources</h3>
            <ul>
              <li><Link to={ROUTE_PATHS.public.terms}>Terms &amp; Conditions</Link></li>
              <li><a href="mailto:support@healthmonitorpro.com">Support Center</a></li>
              <li>Patient safety</li>
            </ul>
          </section>
          <section>
            <h3>Contact</h3>
            <ul>
              <li>support@healthmonitorpro.com</li>
              <li>+92 300 0000000</li>
              <li>Lahore, Pakistan</li>
            </ul>
          </section>
        </div>
        <div className="hm-footer-bottom">
          <p>Copyright 2026 HealthMonitor Pro. All rights reserved.</p>
          <div><Link to={ROUTE_PATHS.public.privacy}>Privacy Policy</Link><Link to={ROUTE_PATHS.public.terms}>Terms of Service</Link></div>
        </div>
      </div>
    </footer>
  );
}

export default function TermsPage() {
  const [searchParams] = useSearchParams();
  const [accepted, setAccepted] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const isLoggedIn = isSessionActive();
  const sessionDashboardRoute = getSessionDashboardRoute();
  const registrationFlow = searchParams.get('flow') === 'registration';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleSection) {
          setActiveSection(visibleSection.target.id);
        }
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: [0.1, 0.35, 0.7] }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="hm-page hm-terms-page">
      <header className="hm-header hm-header-scrolled" role="banner">
        <div className="hm-header-inner">
          <Brand />
          <nav className="hm-nav" aria-label="Primary navigation">
            <Link to={ROUTE_PATHS.public.home}>Home</Link>
            <Link to={ROUTE_PATHS.public.doctors}>Doctors</Link>
            <Link to={ROUTE_PATHS.public.blogs}>Blogs</Link>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="hm-auth-actions">
            {isLoggedIn && sessionDashboardRoute ? <Link to={sessionDashboardRoute} className="hm-btn hm-btn-solid">Dashboard</Link> : <><Link to={ROUTE_PATHS.auth.login} className="hm-btn hm-btn-outline">Login</Link><Link to={ROUTE_PATHS.auth.register} className="hm-btn hm-btn-solid">Register</Link></>}
          </div>
        </div>
      </header>

      <main className="hm-terms-main">
        <div className="section-shell hm-terms-heading">
          <p className="hm-breadcrumb"><Link to={ROUTE_PATHS.public.home}>Home</Link><span>&gt;</span><span>Terms &amp; Conditions</span></p>
          <h1>Terms &amp; Conditions</h1>
          <p>Last updated: April 1, 2025</p>
        </div>

        <div className="section-shell hm-terms-layout">
          <aside className="hm-terms-toc" aria-label="Table of contents">
            <p>On this page</p>
            <nav>
              {sections.map((section, index) => <a className={activeSection === section.id ? 'active' : ''} key={section.id} href={`#${section.id}`}><span>{index + 1}</span>{section.title}</a>)}
            </nav>
          </aside>

          <article className="hm-terms-document">
            <section id="acceptance"><h2><span>01</span>Acceptance of Terms</h2><p>These Terms &amp; Conditions govern your access to and use of HealthMonitor Pro, including our website, applications, and connected services. By accessing the platform, you confirm that you have read and understood these terms.</p><p>If you do not agree with any part of these terms, please do not use HealthMonitor Pro. Your continued use of the platform means you accept the latest version of this agreement.</p></section>
            <section id="eligibility"><h2><span>02</span>Eligibility &amp; Account Registration</h2><p>You must be at least 18 years old, or use the platform with the involvement and consent of a parent or legal guardian. The information you provide during registration must be accurate, current, and complete.</p><p>Keep your password and account credentials private. You are responsible for activity under your account and should notify us promptly if you suspect unauthorized access.</p></section>
            <section id="patient-responsibilities"><h2><span>03</span>Patient Responsibilities</h2><p>Patients are responsible for providing truthful health information and keeping their profile and medication details up to date. Share only information you are comfortable providing to the professionals involved in your care.</p><p>Use the platform as a support tool and follow instructions given by qualified clinicians. Do not rely on records or reminders here as a substitute for your own medical records or prescribed treatment.</p><ul className="hm-terms-list"><li>Provide complete and accurate information.</li><li>Attend scheduled appointments on time.</li><li>Protect your account from unauthorized use.</li></ul></section>
            <section id="doctor-responsibilities"><h2><span>04</span>Doctor Responsibilities &amp; Verification</h2><p>Doctors must provide current professional credentials and maintain any licenses required to practice in their location. HealthMonitor Pro may verify credentials and may suspend profiles that cannot be verified.</p><p>Doctors are responsible for the professional advice they provide, their availability, and their compliance with applicable privacy and healthcare laws. A platform profile does not guarantee a particular outcome.</p></section>
            <section id="medical-disclaimer" className="hm-terms-disclaimer"><h2><span>05</span>Medical Disclaimer</h2><div className="hm-terms-callout"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5m0 3h.01" /></svg><p>HealthMonitor Pro does not provide emergency medical services. In case of emergency, contact your local emergency number immediately. Content on this platform does not replace professional medical judgment.</p></div><p>Information shared through the platform is educational and supportive. It is not a diagnosis, treatment plan, or guarantee that a particular service is suitable for your condition.</p></section>
            <section id="prohibited-uses"><h2><span>06</span>Prohibited Uses</h2><p>You may not use HealthMonitor Pro in a way that harms other users, interferes with the platform, or violates applicable law. You also may not misrepresent your identity or professional qualifications.</p><ul className="hm-terms-list hm-terms-list-danger"><li>Use the service for unlawful, fraudulent, or abusive activity.</li><li>Attempt to access another person&apos;s account or private information.</li><li>Upload malware, deceptive content, or material that infringes another person&apos;s rights.</li><li>Scrape, copy, or reverse engineer the platform without written permission.</li></ul></section>
            <section id="appointments"><h2><span>07</span>Appointments &amp; Cancellations</h2><p>Appointment availability is provided by independent doctors and may change. Please review the details of an appointment before confirming and arrive prepared with relevant information.</p><p>Cancel or reschedule as early as possible. A doctor or HealthMonitor Pro may apply a cancellation policy disclosed at booking, including fees for late cancellations or missed appointments.</p></section>
            <section id="payments"><h2><span>08</span>Payments &amp; Fees</h2><p>Any consultation, subscription, or service fees will be shown before you complete a transaction. You authorize the applicable payment provider to charge your selected payment method for confirmed purchases.</p><p>Refunds are handled according to the policy presented at the time of purchase. HealthMonitor Pro may update pricing with reasonable notice and will not change the price of an already completed transaction.</p></section>
            <section id="content"><h2><span>09</span>Content &amp; Intellectual Property</h2><p>HealthMonitor Pro and its licensors own the platform, software, visual design, trademarks, and original content. These materials are protected by intellectual property laws and are licensed to you for personal, non-commercial use.</p><p>You retain rights to content you submit, but grant us permission to host, process, and display it as needed to provide and improve the service. Do not submit content you do not have permission to share.</p></section>
            <section id="termination"><h2><span>10</span>Termination</h2><p>You may stop using the platform or request account closure at any time. We may suspend or terminate access when necessary to protect users, enforce these terms, or comply with legal obligations.</p><p>Provisions that by their nature should continue after termination, including ownership, disclaimers, liability limits, and dispute terms, will remain in effect.</p></section>
            <section id="liability"><h2><span>11</span>Limitation of Liability</h2><p>To the fullest extent permitted by law, HealthMonitor Pro is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or reliance on its content.</p><p>Our total liability for claims relating to the service will not exceed the amount you paid to HealthMonitor Pro for the service giving rise to the claim during the twelve months before the event.</p></section>
            <section id="governing-law"><h2><span>12</span>Governing Law</h2><p>These terms are governed by the laws applicable in Pakistan, without regard to conflict-of-law rules. Courts located in Lahore will have jurisdiction over disputes unless applicable law requires another forum.</p><p>Before filing a formal claim, please contact us so we can try to resolve the concern informally.</p></section>
            <section id="changes"><h2><span>13</span>Changes to These Terms</h2><p>We may update these terms as the platform evolves or legal requirements change. The updated version will be posted on this page with a new “Last updated” date.</p><p>When changes are material, we will provide additional notice where reasonably possible. Your continued use after an update means you accept the revised terms.</p></section>
            <section id="contact-us"><h2><span>14</span>Contact Us</h2><p>Questions about these terms or our services can be sent to our support team. Include enough detail for us to understand and respond to your request.</p><p>For account or privacy requests, use the email address associated with your account whenever possible.</p></section>

            <aside className="hm-terms-contact-card"><div><p className="hm-terms-contact-eyebrow">Need clarification?</p><h2>Questions about these terms?</h2><p>Contact our support team at legal@healthmonitorpro.com</p></div><a className="hm-btn hm-btn-outline" href="mailto:legal@healthmonitorpro.com">Contact Support</a></aside>
          </article>
        </div>
      </main>

      <LegalFooter />
      {registrationFlow ? <div className="hm-terms-acceptance"><p>By creating an account, you agree to these <a href="#acceptance">Terms &amp; Conditions</a> and our <Link to={ROUTE_PATHS.public.privacy}>Privacy Policy</Link></p><label><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />I have read and agree</label><button className="hm-btn hm-btn-solid" disabled={!accepted}>Continue</button></div> : null}
    </div>
  );
}
