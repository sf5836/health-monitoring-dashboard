import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';

export default function HomePage() {
  return (
    <main className="screen-shell">
      <section className="screen-card">
        <p className="screen-kicker">HealthMonitorPro</p>
        <h1>Frontend Foundation Is Ready</h1>
        <p>
          This is the clean base screen. We can now generate each screen with Stitch MCP and wire it
          to real backend endpoints.
        </p>
        <div className="screen-actions">
          <Link to={ROUTE_PATHS.auth.login} className="button button-primary">
            Next: Design Login Screen
          </Link>
          <Link to={ROUTE_PATHS.public.doctors} className="button button-secondary">
            Future Doctors Route
          </Link>
        </div>
      </section>
    </main>
  );
}
