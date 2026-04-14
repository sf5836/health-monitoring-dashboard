
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import publicService, { type PublicBlog } from '../../services/publicService';

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<PublicBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErrorMessage('Blog id is missing');
      return;
    }

    let ignore = false;
    publicService
      .getPublicBlogById(id)
      .then((item) => {
        if (!ignore) {
          setBlog(item);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load blog');
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
  }, [id]);

  if (loading) {
    return (
      <section className="placeholder-page">
        <h2>Blog</h2>
        <p>Loading article...</p>
      </section>
    );
  }

  if (errorMessage || !blog) {
    return (
      <section className="placeholder-page">
        <h2>Blog</h2>
        <p>{errorMessage || 'Blog not found'}</p>
        <Link to="/blogs">Back to blogs</Link>
      </section>
    );
  }

  return (
    <main className="hm-container" style={{ padding: '2rem 0' }}>
      <article className="hm-card" style={{ maxWidth: 860, margin: '0 auto' }}>
        <span className="hm-pill hm-pill-mint">{blog.category || 'General'}</span>
        <h1>{blog.title}</h1>
        <p className="hm-meta">
          By {blog.authorId?.fullName || 'HealthMonitor Pro'} {blog.publishedAt ? `| ${new Date(blog.publishedAt).toLocaleDateString()}` : ''}
        </p>
        <p>{blog.excerpt}</p>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{blog.content}</div>
        <p className="hm-meta">Views: {blog.views ?? 0}</p>
        <Link to="/blogs" className="hm-btn hm-btn-outline">
          Back to Blogs
        </Link>
      </article>
    </main>
  );
}
