import { Navigate, Route, Routes } from 'react-router-dom';
<<<<<<< HEAD
<<<<<<< HEAD
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import PatientAppointmentsPage from '../pages/patient/PatientAppointmentsPage';
import PatientDashboardPage from '../pages/patient/PatientDashboardPage';
import PatientDoctorsPage from '../pages/patient/PatientDoctorsPage';
import PatientLayout from '../pages/patient/PatientLayout';
import PatientMessagesPage from '../pages/patient/PatientMessagesPage';
import PatientNotificationsPage from '../pages/patient/PatientNotificationsPage';
import PatientPrescriptionsPage from '../pages/patient/PatientPrescriptionsPage';
import PatientProfilePage from '../pages/patient/PatientProfilePage';
import PatientTrendsPage from '../pages/patient/PatientTrendsPage';
import PatientVitalsPage from '../pages/patient/PatientVitalsPage';
import BlogsPage from '../pages/public/BlogsPage';
import DoctorDetailPage from '../pages/public/DoctorDetailPage';
import DoctorsPage from '../pages/public/DoctorsPage';
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
=======
=======
import AdminLoginPage from '../pages/admin/AdminLoginPage';
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
import BlogsPage from '../pages/public/BlogsPage';
import DoctorDetailPage from '../pages/public/DoctorDetailPage';
import DoctorsPage from '../pages/public/DoctorsPage';
import HomePage from '../pages/public/HomePage';
<<<<<<< HEAD
>>>>>>> bbd6be8eb45b80dd474a49dd2221607eea17692f
=======
import LoginPage from '../pages/public/LoginPage';
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
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
<<<<<<< HEAD
<<<<<<< HEAD
      <Route path={ROUTE_PATHS.public.doctorDetail} element={<DoctorDetailPage />} />
      <Route path={ROUTE_PATHS.public.blogs} element={<BlogsPage />} />
      <Route path={ROUTE_PATHS.auth.login} element={<LoginPage />} />
      <Route path={ROUTE_PATHS.auth.adminLogin} element={<AdminLoginPage />} />
      <Route path={ROUTE_PATHS.auth.register} element={<RegisterPage />} />

      <Route path="/patient" element={<PatientLayout />}>
        <Route path="dashboard" element={<PatientDashboardPage />} />
        <Route path="vitals" element={<PatientVitalsPage />} />
        <Route path="trends" element={<PatientTrendsPage />} />
        <Route path="doctors" element={<PatientDoctorsPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
        <Route path="messages" element={<PatientMessagesPage />} />
        <Route path="notifications" element={<PatientNotificationsPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
      </Route>

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
=======
=======
      <Route path={ROUTE_PATHS.public.doctorDetail} element={<DoctorDetailPage />} />
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
      <Route path={ROUTE_PATHS.public.blogs} element={<BlogsPage />} />
      <Route path={ROUTE_PATHS.auth.login} element={<LoginPage />} />
      <Route path={ROUTE_PATHS.auth.adminLogin} element={<AdminLoginPage />} />
      <Route path={ROUTE_PATHS.auth.register} element={<RegisterPage />} />
<<<<<<< HEAD
>>>>>>> bbd6be8eb45b80dd474a49dd2221607eea17692f
=======
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
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
      <Route path="/home" element={<Navigate to={ROUTE_PATHS.public.home} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
