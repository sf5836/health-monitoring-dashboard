import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { sessionStore } from '../../services/sessionStore';

export default function DoctorPendingApprovalPage() {
  const doctorName = sessionStore.getFullName() || 'Doctor';

  return (
    <section className="doctor-pending-shell">
      <article className="doctor-pending-card">
        <p className="doctor-pending-badge">Under Review</p>
        <h1>Your Application Is Being Reviewed</h1>
        <p>
          Thank you, {doctorName}. Your doctor account is registered, and the admin team is verifying your credentials.
          You will be notified once access is approved.
        </p>

        <ol className="doctor-pending-timeline">
          <li className="done">Application Submitted</li>
          <li className="active">Under Admin Review</li>
          <li>Account Approved</li>
          <li>Dashboard Access</li>
        </ol>

        <div className="doctor-pending-actions">
          <Link to={ROUTE_PATHS.auth.login} className="doctor-secondary-button">
            Back to Login
          </Link>
          <button type="button" className="doctor-primary-button" onClick={() => window.location.reload()}>
            Refresh Status
          </button>
        </div>
      </article>
    </section>
  );
}
