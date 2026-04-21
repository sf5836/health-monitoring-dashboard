import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminAppointmentsPage from '../pages/admin/AdminAppointmentsPage';
import AdminBlogsPage from '../pages/admin/AdminBlogsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminDoctorsPage from '../pages/admin/AdminDoctorsPage';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminPatientsPage from '../pages/admin/AdminPatientsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage';
import DoctorBlogsPage from '../pages/doctor/DoctorBlogsPage';
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage';
import DoctorLayout from '../pages/doctor/DoctorLayout';
import DoctorMessagesPage from '../pages/doctor/DoctorMessagesPage';
import DoctorOnboardingPage from '../pages/doctor/DoctorOnboardingPage';
import DoctorPatientDetailPage from '../pages/doctor/DoctorPatientDetailPage';
import DoctorPatientsPage from '../pages/doctor/DoctorPatientsPage';
import DoctorPendingApprovalPage from '../pages/doctor/DoctorPendingApprovalPage';
import DoctorPrescriptionsPage from '../pages/doctor/DoctorPrescriptionsPage';
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage';
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
import RegisterPage from '../pages/public/RegisterPage';
import {
  getSessionDashboardRoute,
  getSessionRole,
  isSessionActive,
  type SessionRole
} from '../services/authSession';
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

function GuestOnly({ children }: Readonly<{ children: ReactNode }>) {
  const dashboardPath = getSessionDashboardRoute();

  if (isSessionActive() && dashboardPath) {
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}

function RequireAuth({
  allowedRoles,
  children,
  loginPath = ROUTE_PATHS.auth.login
}: Readonly<{ allowedRoles: SessionRole[]; children: ReactNode; loginPath?: string }>) {
  const role = getSessionRole();

  if (!isSessionActive() || !role) {
    return <Navigate to={loginPath} replace />;
  }

  if (!allowedRoles.includes(role)) {
    const dashboardPath = getSessionDashboardRoute();
    return <Navigate to={dashboardPath || ROUTE_PATHS.public.home} replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.public.home} element={<HomePage />} />
      <Route path={ROUTE_PATHS.public.doctors} element={<DoctorsPage />} />
      <Route path={ROUTE_PATHS.public.doctorDetail} element={<DoctorDetailPage />} />
      <Route path={ROUTE_PATHS.public.blogs} element={<BlogsPage />} />
      <Route
        path={ROUTE_PATHS.auth.login}
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path={ROUTE_PATHS.auth.adminLogin}
        element={
          <GuestOnly>
            <AdminLoginPage />
          </GuestOnly>
        }
      />
      <Route
        path={ROUTE_PATHS.auth.register}
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/patient"
        element={
          <RequireAuth allowedRoles={['patient']}>
            <PatientLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to={ROUTE_PATHS.patient.dashboard} replace />} />
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
        path="/doctor"
        element={
          <RequireAuth allowedRoles={['doctor']}>
            <DoctorLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to={ROUTE_PATHS.doctor.dashboard} replace />} />
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="patients/:id" element={<DoctorPatientDetailPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="blogs" element={<DoctorBlogsPage />} />
        <Route path="messages" element={<DoctorMessagesPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>
      <Route
        path={ROUTE_PATHS.doctor.onboarding}
        element={
          <RequireAuth allowedRoles={['doctor']}>
            <DoctorOnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path={ROUTE_PATHS.doctor.pendingApproval}
        element={
          <RequireAuth allowedRoles={['doctor']}>
            <DoctorPendingApprovalPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['admin']} loginPath={ROUTE_PATHS.auth.adminLogin}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to={ROUTE_PATHS.admin.dashboard} replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="patients" element={<AdminPatientsPage />} />
        <Route path="blogs" element={<AdminBlogsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="/home" element={<Navigate to={ROUTE_PATHS.public.home} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
