import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { expireCurrentSession } from '../../services/authSession';
import { getDoctorProfile } from '../../services/doctorPortalService';
import { sessionStore } from '../../services/sessionStore';

export default function DoctorPendingApprovalPage() {
  const navigate = useNavigate();
  const doctorName = sessionStore.getFullName() || 'Doctor';
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleBackToLogin = async () => {
    await expireCurrentSession();
    navigate(ROUTE_PATHS.auth.login, { replace: true });
  };

  const handleRefreshStatus = async () => {
    setCheckingStatus(true);
    setStatusMessage('');

    try {
      const profile = await getDoctorProfile();
      const approvalStatus = profile.approvalStatus || 'pending';

      if (approvalStatus === 'approved') {
        navigate(ROUTE_PATHS.doctor.dashboard, { replace: true });
        return;
      }

      if (approvalStatus === 'rejected') {
        setStatusMessage('Your application is rejected by admin. Please update your profile and contact support.');
        return;
      }

      if (approvalStatus === 'suspended') {
        setStatusMessage('Your account is currently suspended. Please contact support for help.');
        return;
      }

      setStatusMessage('Still under review. Please check again in a few moments.');
    } catch {
      setStatusMessage('Unable to refresh status right now. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

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
          <button type="button" className="doctor-secondary-button" onClick={handleBackToLogin}>
            Back to Login
          </button>
          <button type="button" className="doctor-primary-button" onClick={handleRefreshStatus} disabled={checkingStatus}>
            {checkingStatus ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        {statusMessage ? <p className="doctor-pending-help-text">{statusMessage}</p> : null}
      </article>
    </section>
  );
}
