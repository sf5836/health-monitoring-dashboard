import { useState } from 'react';

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveBlogs, setAutoApproveBlogs] = useState(false);

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>System Settings</h2>
          <p>Global controls for HealthMonitor Pro platform governance</p>
        </div>
      </header>

      <section className="admin-settings-grid">
        <article className="admin-card">
          <h3>Platform Controls</h3>
          <div className="admin-setting-row">
            <div>
              <p>Maintenance Mode</p>
              <small>Pause new registrations and non-critical user actions.</small>
            </div>
            <button
              type="button"
              className={`admin-toggle ${maintenanceMode ? 'is-on' : ''}`}
              onClick={() => setMaintenanceMode((previous) => !previous)}
            >
              {maintenanceMode ? 'On' : 'Off'}
            </button>
          </div>

          <div className="admin-setting-row">
            <div>
              <p>Auto-approve admin blogs</p>
              <small>Automatically publish content created by admin users.</small>
            </div>
            <button
              type="button"
              className={`admin-toggle ${autoApproveBlogs ? 'is-on' : ''}`}
              onClick={() => setAutoApproveBlogs((previous) => !previous)}
            >
              {autoApproveBlogs ? 'On' : 'Off'}
            </button>
          </div>
        </article>

        <article className="admin-card">
          <h3>Security & Audit</h3>
          <ul className="admin-list">
            <li className="admin-list-item">
              <div>
                <p>Review role audit trail</p>
                <small>All moderation actions are logged in backend audit records.</small>
              </div>
              <button type="button" className="admin-secondary-button">
                Open Logs
              </button>
            </li>
            <li className="admin-list-item">
              <div>
                <p>Rotate admin access tokens</p>
                <small>Force token refresh on all active admin sessions.</small>
              </div>
              <button type="button" className="admin-secondary-button">
                Rotate
              </button>
            </li>
          </ul>
        </article>
      </section>
    </section>
  );
}
