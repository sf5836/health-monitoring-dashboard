import { Navigate, Route, Routes } from 'react-router-dom';
import BlogsPage from '../pages/public/BlogsPage';
import DoctorsPage from '../pages/public/DoctorsPage';
import HomePage from '../pages/public/HomePage';
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

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.public.home} element={<HomePage />} />
      <Route path={ROUTE_PATHS.public.doctors} element={<DoctorsPage />} />
      <Route path={ROUTE_PATHS.public.blogs} element={<BlogsPage />} />
      <Route path="/home" element={<Navigate to={ROUTE_PATHS.public.home} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
