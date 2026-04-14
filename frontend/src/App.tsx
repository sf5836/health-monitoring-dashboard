import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/public/HomePage.tsx';
import DoctorsPage from './pages/public/DoctorsPage.tsx';
import DoctorDetailPage from './pages/public/DoctorDetailPage.tsx';
import BlogsPage from './pages/public/BlogsPage.tsx';
import BlogDetailPage from './pages/public/BlogDetailPage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage from './pages/auth/RegisterPage.tsx';
import DashboardPage from './pages/patient/DashboardPage.tsx';
import VitalsPage from './pages/patient/VitalsPage.tsx';
import TrendsPage from './pages/patient/TrendsPage.tsx';
import MyDoctorsPage from './pages/patient/MyDoctorsPage.tsx';
import AppointmentsPage from './pages/patient/AppointmentsPage.tsx';
import MessagesPage from './pages/patient/MessagesPage.tsx';
import PrescriptionsPage from './pages/patient/PrescriptionsPage.tsx';
import DoctorDashboardPage from './pages/doctor/DashboardPage.tsx';
import DoctorPatientsPage from './pages/doctor/PatientsPage.tsx';
import DoctorPatientDetailPage from './pages/doctor/PatientDetailPage.tsx';
import DoctorBlogsPage from './pages/doctor/BlogsPage.tsx';
import DoctorPrescriptionsPage from './pages/doctor/PrescriptionsPage.tsx';
import DoctorAppointmentsPage from './pages/doctor/AppointmentsPage.tsx';
import DoctorMessagesPage from './pages/doctor/DoctorMessagesPage.tsx';
import DoctorProfilePage from './pages/doctor/ProfilePage.tsx';
import DoctorPendingApprovalPage from './pages/doctor/PendingApprovalPage.tsx';
import AdminLoginPage from './pages/admin/LoginPage.tsx';
import AdminDashboardPage from './pages/admin/DashboardPage.tsx';
import AdminDoctorsPage from './pages/admin/DoctorsPage.tsx';
import AdminBlogsPage from './pages/admin/BlogsPage.tsx';
import AdminAnalyticsPage from './pages/admin/AnalyticsPage.tsx';
import PrivateRoute from './routes/PrivateRoute.tsx';
import RoleGuard from './routes/RoleGuard.tsx';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:id" element={<BlogDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/patient/dashboard"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <DashboardPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/vitals"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <VitalsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/trends"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <TrendsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/doctors"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <MyDoctorsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <AppointmentsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/prescriptions"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <PrescriptionsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/messages"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['patient']}>
                <MessagesPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/dashboard"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorDashboardPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorPatientsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorPatientDetailPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/blogs"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorBlogsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/prescriptions"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorPrescriptionsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorAppointmentsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/messages"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorMessagesPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorProfilePage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/pending-approval"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['doctor']}>
                <DoctorPendingApprovalPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute redirectTo="/admin/login">
              <RoleGuard allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <PrivateRoute redirectTo="/admin/login">
              <RoleGuard allowedRoles={['admin']}>
                <AdminDoctorsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/blogs"
          element={
            <PrivateRoute redirectTo="/admin/login">
              <RoleGuard allowedRoles={['admin']}>
                <AdminBlogsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <PrivateRoute redirectTo="/admin/login">
              <RoleGuard allowedRoles={['admin']}>
                <AdminAnalyticsPage />
              </RoleGuard>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
