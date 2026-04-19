import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import BlogsPage from '../pages/public/BlogsPage';
import DoctorDetailPage from '../pages/public/DoctorDetailPage';
import DoctorsPage from '../pages/public/DoctorsPage';
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import { ROUTE_PATHS } from './routePaths';

function NotFoundPage() {
  return (
    <main className="screen-shell">
      <section className="screen-card">
        <h1>Page Not Found</h1>
        <p>This route does not exist yet. It will be added during screen-by-screen build.</p>
      </section>
    </main>
  );
}

function PlaceholderPage({ title }: Readonly<{ title: string }>) {
  return (
    <main className="screen-shell">
      <section className="screen-card">
        <h1>{title}</h1>
        <p>This screen is connected and will be implemented in the next phase.</p>
      </section>
    </main>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.public.home} element={<HomePage />} />
      <Route path={ROUTE_PATHS.public.doctors} element={<DoctorsPage />} />
      <Route path={ROUTE_PATHS.public.doctorDetail} element={<DoctorDetailPage />} />
      <Route path={ROUTE_PATHS.public.blogs} element={<BlogsPage />} />
      <Route path={ROUTE_PATHS.auth.login} element={<LoginPage />} />
      <Route path={ROUTE_PATHS.auth.adminLogin} element={<AdminLoginPage />} />
      <Route path={ROUTE_PATHS.auth.register} element={<RegisterPage />} />
      <Route
        path={ROUTE_PATHS.patient.dashboard}
        element={<PlaceholderPage title="Patient Dashboard" />}
      />
      <Route
        path={ROUTE_PATHS.doctor.dashboard}
        element={<PlaceholderPage title="Doctor Dashboard" />}
      />
      <Route
        path={ROUTE_PATHS.doctor.pendingApproval}
        element={<PlaceholderPage title="Doctor Pending Approval" />}
      />
      <Route
        path={ROUTE_PATHS.admin.dashboard}
        element={<PlaceholderPage title="Admin Dashboard" />}
      />
      <Route path="/home" element={<Navigate to={ROUTE_PATHS.public.home} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
