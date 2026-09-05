import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { getSessionDashboardRoute, isSessionActive } from '../../services/authSession';

const sections = [
  ['information', 'Information We Collect'],
  ['use', 'How We Use Your Data'],
  ['encryption', 'Data Storage & Encryption'],
  ['access', 'Who Can Access Your Data'],
  ['third-party', 'Third-Party Services'],
  ['cookies', 'Cookies & Tracking'],
  ['rights', 'Your Rights & Data Control'],
  ['retention', 'Data Retention & Deletion'],
  ['children', "Children's Privacy"],
  ['incident', 'Security Incident Response'],
  ['changes', 'Changes to This Policy'],
  ['contact', 'Contact Our Privacy Team']
] as const;

const securityFeatures = [
  ['lock', 'Encryption at Rest', 'All health records encrypted in MongoDB'],
  ['key', 'JWT Authentication', 'Short-lived access tokens with rotation'],
  ['shield', 'Role-Based Access', 'Patients, doctors, and admins see only what they are permitted to'],
  ['globe', 'HTTPS Everywhere', 'All traffic encrypted in transit via TLS'],
  ['audit', 'Audit Logging', 'Every admin action is logged and traceable'],
  ['cloud', 'Secure Cloud Storage', 'Documents and photos stored in access-controlled AWS S3 buckets']
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    lock: 'M7 11V8a5 5 0 0 1 10 0v3m-12 0h14v10H5V11Zm7 4v2',
    key: 'm15 7 6 6-2 2-2-2-2 2-2-2-3 3-3-3 3-3a4 4 0 1 1 3 3l-3 3',
    shield: 'M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Zm-3 9 2 2 4-4',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2 2.2 3 5.2 3 9s-1 6.8-3 9c-2-2.2-3-5.2-3-9s1-6.8 3-9Z',
    audit: 'M6 3h9l3 3v15H6V3Zm9 0v4h4M9 11h6M9 15h6M9 7h2',
    cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9Z',
    download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 20h16',
    edit: 'm4 20 4-.8L19 8.2a2 2 0 0 0-3-3L5 16l-1 4Z',
    trash: 'M5 7h14m-9 4v5m4-5v5M9 7V4h6v3m-8 0 1 14h8l1-14',
    revoke: 'M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5'
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] || paths.shield} /></svg>;
}

function Brand() {
  return <Link to={ROUTE_PATHS.public.home} className="hm-brand" aria-label="HealthMonitor Pro home"><span className="hm-brand-icon" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M14 24s-9-5.7-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.3-9 12-9 12z" /><path d="M6 14h4l2-3 2 6 2-4h6" /></svg></span><span className="hm-brand-text">HealthMonitor Pro</span></Link>;
}

function PrivacyFooter() {
  return <footer className="hm-footer"><div className="section-shell"><div className="hm-footer-grid"><section><h3>About HealthMonitor Pro</h3><p>A secure health monitoring platform helping patients and doctors stay connected with real-time insight and trusted clinical guidance.</p></section><section><h3>Quick Links</h3><ul><li><Link to={ROUTE_PATHS.public.home}>Home</Link></li><li><Link to={ROUTE_PATHS.public.doctors}>Doctors</Link></li><li><Link to={ROUTE_PATHS.public.blogs}>Blogs</Link></li></ul></section><section><h3>Resources</h3><ul><li><Link to={ROUTE_PATHS.public.terms}>Terms &amp; Conditions</Link></li><li><Link to={ROUTE_PATHS.public.privacy}>Privacy Policy</Link></li><li>Patient safety</li></ul></section><section><h3>Contact</h3><ul><li>support@healthmonitorpro.com</li><li>+92 300 0000000</li><li>Lahore, Pakistan</li></ul></section></div><div className="hm-footer-bottom"><p>Copyright 2026 HealthMonitor Pro. All rights reserved.</p><div><Link to={ROUTE_PATHS.public.privacy}>Privacy Policy</Link><Link to={ROUTE_PATHS.public.terms}>Terms of Service</Link></div></div></div></footer>;
}

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState<string>(sections[0][0]);
  const isLoggedIn = isSessionActive();
  const sessionDashboardRoute = getSessionDashboardRoute();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-120px 0px -55% 0px', threshold: [0.1, 0.35, 0.7] });
    sections.forEach(([id]) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  return <div className="hm-page hm-privacy-page">
    <header className="hm-header hm-header-scrolled" role="banner"><div className="hm-header-inner"><Brand /><nav className="hm-nav" aria-label="Primary navigation"><Link to={ROUTE_PATHS.public.home}>Home</Link><Link to={ROUTE_PATHS.public.doctors}>Doctors</Link><Link to={ROUTE_PATHS.public.blogs}>Blogs</Link><a href="#about">About</a><a href="#contact">Contact</a></nav><div className="hm-auth-actions">{isLoggedIn && sessionDashboardRoute ? <Link to={sessionDashboardRoute} className="hm-btn hm-btn-solid">Dashboard</Link> : <><Link to={ROUTE_PATHS.auth.login} className="hm-btn hm-btn-outline">Login</Link><Link to={ROUTE_PATHS.auth.register} className="hm-btn hm-btn-solid">Register</Link></>}</div></div></header>
    <main className="hm-privacy-main">
      <div className="section-shell hm-privacy-heading"><p className="hm-breadcrumb"><Link to={ROUTE_PATHS.public.home}>Home</Link><span>&gt;</span><span>Privacy &amp; Security</span></p><h1>Privacy Policy &amp; Security</h1><p>Last updated: April 1, 2025 <span>·</span> How we protect your health data</p><div className="hm-trust-badges"><span><Icon name="lock" />256-bit Encrypted</span><span><Icon name="shield" />HIPAA Aligned</span><span><Icon name="audit" />Role-Based Access Control</span></div></div>
      <div className="section-shell hm-privacy-intro"><div className="hm-privacy-intro-icon"><Icon name="shield" /></div><p>Your health data deserves the highest level of protection. This page explains what we collect, why we collect it, and exactly how it&apos;s secured.</p></div>
      <div className="section-shell hm-privacy-layout"><aside className="hm-terms-toc hm-privacy-toc"><p>On this page</p><nav>{sections.map(([id, title], index) => <a className={activeSection === id ? 'active' : ''} key={id} href={`#${id}`}><span>{String(index + 1).padStart(2, '0')}</span>{title}</a>)}</nav></aside>
        <article className="hm-terms-document hm-privacy-document">
          <section id="information"><h2><span>01</span>Information We Collect</h2><p>We collect information you choose to provide and data needed to operate a secure care platform. The information depends on whether you use HealthMonitor Pro as a patient, doctor, or support user.</p><div className="hm-data-cards"><div className="hm-data-card"><div className="hm-data-card-icon"><Icon name="shield" /></div><h3>Patient Data</h3><ul><li>Vitals and wellness measurements</li><li>Medical history and care notes</li><li>Prescriptions and uploaded documents</li></ul></div><div className="hm-data-card"><div className="hm-data-card-icon"><Icon name="audit" /></div><h3>Doctor Data</h3><ul><li>Professional credentials and license</li><li>Specialization and availability</li><li>Profile, appointment, and review data</li></ul></div></div></section>
          <section id="use"><h2><span>02</span>How We Use Your Data</h2><p>We use your information to provide secure health tracking, appointment coordination, messaging, and account support. We also use aggregated, de-identified information to improve reliability and understand product usage.</p><p>We do not sell personal health information. We process data only for the purposes described here, to meet our legal obligations, or with your consent.</p></section>
          <section id="encryption"><h2><span>03</span>Data Storage &amp; Encryption</h2><p>Security is built into each layer of the platform. We protect data in transit and at rest, restrict access by role, and maintain records that help us investigate changes to sensitive information.</p><div className="hm-security-grid">{securityFeatures.map(([icon, title, description]) => <div className="hm-security-card" key={title}><div className="hm-security-icon"><Icon name={icon} /></div><h3>{title}</h3><p>{description}</p><span className="hm-tech-label">SECURE_LAYER</span></div>)}</div></section>
          <section id="access"><h2><span>04</span>Who Can Access Your Data</h2><p>Access is limited to people who need information to provide care, operate the platform, or meet a support request. Permissions are reviewed and enforced through role-based controls.</p><div className="hm-access-table-wrap"><table className="hm-access-table"><thead><tr><th>Role</th><th>Profile &amp; account</th><th>Health records</th><th>Admin controls</th></tr></thead><tbody><tr><th>Patient</th><td><b className="hm-check">✓</b> Own data</td><td><b className="hm-check">✓</b> Own data</td><td><b className="hm-dash">—</b></td></tr><tr><th>Connected Doctor</th><td><b className="hm-check">✓</b> Shared profile</td><td><b className="hm-check">✓</b> Assigned patients</td><td><b className="hm-dash">—</b></td></tr><tr><th>Admin</th><td><b className="hm-check">✓</b> Operational</td><td><b className="hm-check">✓</b> As needed</td><td><b className="hm-check">✓</b> Managed</td></tr><tr><th>Support</th><td><b className="hm-check">✓</b> With request</td><td><b className="hm-dash">—</b></td><td><b className="hm-dash">—</b></td></tr></tbody></table></div></section>
          <section id="third-party"><h2><span>05</span>Third-Party Services</h2><p>We use carefully selected providers to deliver parts of the service. AWS S3 stores documents and photos in access-controlled buckets, email providers deliver account notifications, and payment providers process transactions without exposing full payment details to HealthMonitor Pro.</p></section>
          <section id="cookies"><h2><span>06</span>Cookies &amp; Tracking</h2><p>We use essential cookies and local storage to keep sessions secure, remember preferences, and understand basic service performance. You can manage optional cookies through your browser settings, though some platform features may not work as expected.</p></section>
          <section id="rights"><h2><span>07</span>Your Rights &amp; Data Control</h2><p>You can request a copy, correction, or deletion of your personal information. You can also withdraw a doctor&apos;s access where the relationship or applicable care process allows it.</p><div className="hm-rights-grid">{[['download', 'Download My Data'], ['edit', 'Request Correction'], ['trash', 'Delete My Account'], ['revoke', 'Revoke Doctor Access']].map(([icon, label]) => <div className="hm-right-card" key={label}><Icon name={icon} /><strong>{label}</strong><button type="button">Request</button></div>)}</div></section>
          <section id="retention"><h2><span>08</span>Data Retention &amp; Deletion</h2><p>We retain information only as long as needed to provide the service, meet legal and clinical record obligations, resolve disputes, and enforce our agreements. When data is no longer required, we securely delete or anonymize it.</p></section>
          <section id="children"><h2><span>09</span>Children&apos;s Privacy</h2><p>HealthMonitor Pro is intended for adults and is not directed to children under 18. If you believe a child has provided personal information without appropriate consent, contact our privacy team so we can investigate and remove it where required.</p></section>
          <section id="incident"><h2><span>10</span>Security Incident Response</h2><div className="hm-incident-callout"><Icon name="shield" /><p>If we become aware of a data breach affecting your information, we will notify affected users within 72 hours in accordance with applicable regulations.</p></div><p>Our response process includes containment, investigation, remediation, and communication with affected people and regulators when required.</p></section>
          <section id="changes"><h2><span>11</span>Changes to This Policy</h2><p>We may update this policy as our service or legal obligations change. Material updates will be posted here with a revised date and, where appropriate, communicated through the platform.</p></section>
          <section id="contact"><h2><span>12</span>Contact Our Privacy Team</h2><p>For questions about this policy, requests about your data, or concerns about how information is handled, contact our privacy team.</p></section>
          <aside className="hm-security-contact"><div><p>PRIVACY &amp; SECURITY</p><h2>Report a Security Concern</h2><span>security@healthmonitorpro.com</span></div><a className="hm-btn" href="mailto:security@healthmonitorpro.com">Report an Issue</a></aside>
        </article>
      </div>
    </main>
    <PrivacyFooter />
  </div>;
}
