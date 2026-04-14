
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import publicService, { type PublicBlog } from '../../services/publicService';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<PublicBlog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    publicService
      .getPublicBlogs()
      .then((items) => {
        if (!ignore) {
          setBlogs(items);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load blogs');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredBlogs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return blogs;
    }
    return blogs.filter((blog) => {
      const haystack = `${blog.title} ${blog.excerpt || ''} ${blog.category || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [blogs, search]);

  return (
    <div className="hm-home">
      <header className="hm-header">
        <div className="hm-container hm-header-inner">
          <div className="hm-brand">
            <span className="hm-heart">+</span>
            <span>HealthMonitor Pro</span>
          </div>
          <nav className="hm-nav">
            <Link to="/">Home</Link>
            <Link to="/doctors">Doctors</Link>
            <Link to="/blogs">Blogs</Link>
          </nav>
          <div className="hm-auth-actions">
            <Link to="/login" className="hm-btn hm-btn-outline">
              Login
            </Link>
            <Link to="/register" className="hm-btn hm-btn-primary">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="hm-container" style={{ padding: '2rem 0' }}>
        <section className="hm-section-head">
          <h1>Health Articles</h1>
          <p>Insights from verified specialists</p>
          <input
            type="search"
            placeholder="Search articles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 420, padding: '0.7rem 0.9rem' }}
          />
        </section>

        {loading ? <p>Loading blogs...</p> : null}
        {errorMessage ? <p>{errorMessage}</p> : null}

        {!loading && !errorMessage ? (
          <section className="hm-grid-3">
            {filteredBlogs.map((blog) => (
              <article key={blog._id} className="hm-blog-card">
                <div className="hm-blog-cover" />
                <span className="hm-pill hm-pill-mint">{blog.category || 'General'}</span>
                <h3>{blog.title}</h3>
                <p className="hm-meta">{blog.authorId?.fullName || 'HealthMonitor Pro'}</p>
                <p>{blog.excerpt || blog.content.slice(0, 140)}...</p>
                <Link to={`/blogs/${blog._id}`} className="hm-btn hm-btn-outline hm-btn-block">
                  Read Article
                </Link>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
