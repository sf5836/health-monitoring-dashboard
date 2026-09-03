import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicBlogs } from '../../data/publicContent';
import { getPublicBlogs, type PublicBlogCard } from '../../services/publicContentService';
import { ROUTE_PATHS } from '../../routes/routePaths';

const BLOG_FALLBACK_COVER =
  'linear-gradient(135deg, rgba(17, 94, 72, 0.96) 0%, rgba(45, 196, 141, 0.86) 48%, rgba(232, 249, 242, 0.9) 100%)';

function getBlogCoverStyle(coverImageUrl?: string) {
  const resolvedUrl = coverImageUrl && coverImageUrl.trim() ? coverImageUrl.trim() : '';
  return {
    backgroundImage: resolvedUrl
      ? `url("${resolvedUrl}"), ${BLOG_FALLBACK_COVER}`
      : BLOG_FALLBACK_COVER,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<PublicBlogCard[]>(
    publicBlogs.map((blog, index) => ({
      id: String(index),
      category: blog.category,
      title: blog.title,
      author: blog.author,
      date: blog.date,
      excerpt: blog.excerpt,
      coverImageUrl: blog.coverImageUrl
    }))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBlogs() {
      try {
        const liveBlogs = await getPublicBlogs(60);
        if (!cancelled && liveBlogs.length > 0) {
          setBlogs(liveBlogs);
        }
      } catch {
        // Keep fallback content.
      }
    }

    loadBlogs();
    const intervalId = window.setInterval(loadBlogs, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="hm-page">
      <section className="section-shell hm-section hm-listing-head">
        <p className="hm-kicker">Health Knowledge Hub</p>
        <h1>All Featured Articles</h1>
        <p className="hm-subtext">Explore all blog posts from verified specialists.</p>
        <Link to={ROUTE_PATHS.public.home} className="hm-btn hm-btn-outline">
          Back to Home
        </Link>
      </section>

      <section className="section-shell hm-section hm-listing-section">
        <div className="hm-card-grid hm-card-grid-3">
          {blogs.map((blog) => (
            <Link key={blog.id} to={`${ROUTE_PATHS.public.blogs}/${blog.id}`} className="hm-card hm-blog-card">
              <div className="hm-blog-cover" aria-hidden="true" style={getBlogCoverStyle(blog.coverImageUrl)} />
              <div className="hm-blog-content">
                <span className="hm-pill">{blog.category}</span>
                <h3>{blog.title}</h3>
                <p className="hm-blog-meta">
                  {blog.author} | {blog.date}
                </p>
                <p className="hm-blog-excerpt">{blog.excerpt}</p>
                <span className="hm-read-time">5 min read</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
