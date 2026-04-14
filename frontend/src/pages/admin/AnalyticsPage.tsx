import { useEffect, useState } from 'react';
import adminService, {
  type AdminAnalyticsOverview,
  type AdminAnalyticsGrowth,
  type AdminAnalyticsBlogs
} from '../../services/adminService';
import { ApiError } from '../../services/apiClient';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [growth, setGrowth] = useState<AdminAnalyticsGrowth | null>(null);
  const [blogs, setBlogs] = useState<AdminAnalyticsBlogs | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getAnalyticsOverview(),
      adminService.getAnalyticsGrowth(),
      adminService.getAnalyticsBlogs()
    ])
      .then(([o, g, b]) => {
        setOverview(o);
        setGrowth(g);
        setBlogs(b);
      })
      .catch((error: unknown) => setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load analytics'));
  }, []);

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Admin Analytics</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}

      <section className="hm-grid-3" style={{ marginBottom: '1rem' }}>
        <article className="hm-card"><p>Total Users</p><h3>{overview?.totalUsers || 0}</h3></article>
        <article className="hm-card"><p>Active Doctors</p><h3>{overview?.activeDoctors || 0}</h3></article>
        <article className="hm-card"><p>Total Patients</p><h3>{overview?.totalPatients || 0}</h3></article>
        <article className="hm-card"><p>Total Blogs</p><h3>{overview?.totalBlogs || 0}</h3></article>
        <article className="hm-card"><p>Pending Blogs</p><h3>{overview?.pendingBlogs || 0}</h3></article>
        <article className="hm-card"><p>High Risk Vitals</p><h3>{overview?.highRiskVitals || 0}</h3></article>
      </section>

      <section className="hm-grid-2">
        <article className="hm-card">
          <h3>Growth ({growth?.periodMonths || 0} months)</h3>
          <p>Users points: {growth?.users?.length || 0}</p>
          <p>Doctors points: {growth?.doctors?.length || 0}</p>
          <p>Patients points: {growth?.patients?.length || 0}</p>
          <p>Blogs points: {growth?.blogs?.length || 0}</p>
        </article>
        <article className="hm-card">
          <h3>Blog Insights</h3>
          <p>Status buckets: {blogs?.statusBreakdown?.length || 0}</p>
          <p>Category buckets: {blogs?.categoryBreakdown?.length || 0}</p>
          <p>Top published blogs: {blogs?.topBlogs?.length || 0}</p>
        </article>
      </section>
    </main>
  );
}
