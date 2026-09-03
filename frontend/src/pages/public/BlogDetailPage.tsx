import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicBlogs } from '../../data/publicContent';
import { getPublicBlogById, type PublicBlogDetail } from '../../services/publicContentService';
import { ROUTE_PATHS } from '../../routes/routePaths';

const FALLBACK_COVER =
  'linear-gradient(135deg, rgba(13, 92, 69, 0.98), rgba(45, 196, 141, 0.9) 58%, rgba(232, 249, 242, 0.95))';

function coverStyle(url?: string) {
  return {
    backgroundImage: url ? `url("${url}"), ${FALLBACK_COVER}` : FALLBACK_COVER,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}

function fallbackBlog(id: string): PublicBlogDetail | undefined {
  const blog = publicBlogs[Number(id)];
  if (!blog) return undefined;
  return {
    ...blog,
    id,
    content: `${blog.excerpt}\n\nOur specialists share practical, evidence-informed guidance to help you make confident decisions about your everyday health. Use this information as a starting point for a conversation with your care team.`,
    views: 0
  };
}

export default function BlogDetailPage() {
  const { id = '' } = useParams();
  const [blog, setBlog] = useState<PublicBlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getPublicBlogById(id)
      .then((result) => {
        if (!cancelled) setBlog(result);
      })
      .catch(() => {
        const localBlog = fallbackBlog(id);
        if (!cancelled) {
          setBlog(localBlog || null);
          setError(localBlog ? '' : 'This article could not be found.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <main className="hm-page"><p className="hm-detail-status">Loading article...</p></main>;
  if (!blog) {
    return (
      <main className="hm-page">
        <section className="section-shell hm-section hm-detail-status">
          <h1>Article unavailable</h1>
          <p>{error}</p>
          <Link to={ROUTE_PATHS.public.blogs} className="hm-btn hm-btn-primary">Browse all articles</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="hm-page">
      <section className="section-shell hm-section hm-article-wrap">
        <Link to={ROUTE_PATHS.public.blogs} className="hm-back-link">Back to Health Knowledge Hub</Link>
        <div className="hm-article-hero" style={coverStyle(blog.coverImageUrl)}>
          <div className="hm-article-hero-overlay">
            <p className="hm-article-eyebrow">HealthMonitor Pro Journal</p>
            <span className="hm-pill hm-pill-light">{blog.category}</span>
            <h1>{blog.title}</h1>
          </div>
        </div>

        <div className="hm-article-layout">
          <article className="hm-article-body">
            <div className="hm-article-meta">
              <span>By {blog.author}</span>
              <span>{blog.date}</span>
              <span>5 min read</span>
              {blog.views ? <span>{blog.views.toLocaleString()} views</span> : null}
            </div>
            <p className="hm-article-lede">{blog.excerpt}</p>
            <div className="hm-article-copy">
              {blog.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
                <p key={`${blog.id}-${index}`}>{paragraph.trim()}</p>
              ))}
            </div>
            <div className="hm-article-footer">
              <span>Reviewed by HealthMonitor Pro specialists</span>
              <Link to={ROUTE_PATHS.public.doctors} className="hm-btn hm-btn-outline">Find a specialist</Link>
            </div>
          </article>

          <aside className="hm-article-aside">
            <div className="hm-article-aside-card">
              <p className="hm-article-aside-label">ABOUT THIS ARTICLE</p>
              <h2>Practical guidance for better everyday care.</h2>
              <p>Written for patients and reviewed by the HealthMonitor Pro specialist network.</p>
              <Link to={ROUTE_PATHS.public.doctors} className="hm-btn hm-btn-primary">Meet our specialists</Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
