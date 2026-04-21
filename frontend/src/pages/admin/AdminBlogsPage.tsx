import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createAdminBlog,
  deleteAdminBlog,
  getAdminBlogs,
  publishAdminBlog,
  rejectAdminBlog,
  updateAdminBlog,
  type AdminBlog
} from '../../services/adminPortalService';
import { formatDate, formatRelativeTime, statusClass } from './adminUi';

type BlogTab = 'pending' | 'all' | 'rejected';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [activeTab, setActiveTab] = useState<BlogTab>('pending');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminBlog['status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [previewBlog, setPreviewBlog] = useState<AdminBlog | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState('');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadBlogs() {
      try {
        const data = await getAdminBlogs();
        if (cancelled) return;
        setBlogs(data);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load blog management data.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBlogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingBlogs = useMemo(
    () => blogs.filter((blog) => blog.status === 'pending_review'),
    [blogs]
  );

  const rejectedBlogs = useMemo(
    () => blogs.filter((blog) => blog.status === 'rejected'),
    [blogs]
  );

  const visibleBlogs = useMemo(() => {
    const byTab = activeTab === 'pending' ? pendingBlogs : activeTab === 'rejected' ? rejectedBlogs : blogs;
    if (statusFilter === 'all') return byTab;
    return byTab.filter((blog) => blog.status === statusFilter);
  }, [activeTab, blogs, pendingBlogs, rejectedBlogs, statusFilter]);

  function mutateBlog(blogId: string, patch: Partial<AdminBlog>) {
    setBlogs((previous) => previous.map((blog) => (blog.id === blogId ? { ...blog, ...patch } : blog)));
  }

  async function onPublish(blog: AdminBlog) {
    try {
      await publishAdminBlog(blog.id);
      mutateBlog(blog.id, { status: 'published', rejectionReason: undefined, publishedAt: new Date().toISOString() });
      setPreviewBlog(null);
    } catch {
      setError('Unable to publish this article right now.');
    }
  }

  async function onReject(blog: AdminBlog, reason: string) {
    try {
      await rejectAdminBlog(blog.id, reason || 'Rejected by admin');
      mutateBlog(blog.id, { status: 'rejected', rejectionReason: reason || 'Rejected by admin' });
      setPreviewBlog(null);
      setRejectReason('');
    } catch {
      setError('Unable to reject this article right now.');
    }
  }

  async function onDelete(blog: AdminBlog) {
    if (!window.confirm(`Delete blog "${blog.title}"?`)) return;

    try {
      await deleteAdminBlog(blog.id);
      setBlogs((previous) => previous.filter((item) => item.id !== blog.id));
    } catch {
      setError('Unable to delete this article right now.');
    }
  }

  function openEditor(blog?: AdminBlog) {
    if (blog) {
      setEditingBlogId(blog.id);
      setTitle(blog.title);
      setExcerpt(blog.excerpt || '');
      setContent(blog.content || '');
      setCoverImageUrl(blog.coverImageUrl || '');
      setCategory(blog.category || '');
      setTags((blog.tags || []).join(', '));
    } else {
      setEditingBlogId('');
      setTitle('');
      setExcerpt('');
      setContent('');
      setCoverImageUrl('');
      setCategory('');
      setTags('');
    }

    setIsEditorOpen(true);
  }

  async function saveBlog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      content: content.trim(),
      coverImageUrl: coverImageUrl.trim() || undefined,
      category: category.trim() || undefined,
      tags: tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: 'published' as const
    };

    try {
      if (editingBlogId) {
        const updated = await updateAdminBlog(editingBlogId, payload);
        setBlogs((previous) => [updated, ...previous.filter((blog) => blog.id !== updated.id)]);
      } else {
        const created = await createAdminBlog(payload);
        setBlogs((previous) => [created, ...previous]);
      }

      setIsEditorOpen(false);
      setError('');
    } catch {
      setError('Unable to save blog right now.');
    }
  }

  if (loading) {
    return <p className="admin-page-status">Loading blog management...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>Blog Management</h2>
          <p>
            {blogs.filter((item) => item.status === 'published').length} published | {pendingBlogs.length} pending |{' '}
            {rejectedBlogs.length} rejected
          </p>
        </div>
        <div className="admin-inline-actions">
          <button type="button" className="admin-primary-button" onClick={() => openEditor()}>
            Write Blog
          </button>
          <button type="button" className="admin-secondary-button" onClick={() => window.print()}>
            Export
          </button>
        </div>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <section className="admin-tab-row">
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'pending' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({pendingBlogs.length})
        </button>
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Blogs
        </button>
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'rejected' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({rejectedBlogs.length})
        </button>
      </section>

      {activeTab === 'pending' ? (
        <>
          <article className="admin-info-banner warning">{pendingBlogs.length} articles require review.</article>

          <section className="admin-blog-card-grid">
            {pendingBlogs.length === 0 ? (
              <p className="admin-empty-state">No pending blog submissions.</p>
            ) : (
              pendingBlogs.map((blog) => (
                <article key={blog.id} className="admin-blog-review-card">
                  <img
                    src={blog.coverImageUrl || 'https://placehold.co/160x110/e8f9f2/0d5c45?text=Blog'}
                    alt={blog.title}
                    loading="lazy"
                  />

                  <div>
                    <h3>{blog.title}</h3>
                    <p>By {blog.authorName}</p>
                    <small>
                      {blog.category || 'General'} · {formatRelativeTime(blog.submittedAt)} · {Math.max(1, Math.ceil((blog.content || '').split(/\s+/).length / 200))} min read
                    </small>
                    <p className="admin-blog-excerpt">{blog.excerpt || 'No excerpt provided.'}</p>
                  </div>

                  <div className="admin-inline-actions end">
                    <button type="button" className="admin-secondary-button" onClick={() => setPreviewBlog(blog)}>
                      Preview Article
                    </button>
                    <button type="button" className="admin-primary-button" onClick={() => onPublish(blog)}>
                      Publish
                    </button>
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => onReject(blog, 'Rejected by admin quick action')}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      ) : (
        <article className="admin-card">
          <div className="admin-table-toolbar">
            <div className="admin-inline-actions wrap">
              {(['all', 'published', 'rejected', 'pending_review', 'draft', 'unpublished'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`admin-tab-pill ${statusFilter === status ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Published Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBlogs.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <p className="admin-empty-state">No blogs found.</p>
                    </td>
                  </tr>
                ) : (
                  visibleBlogs.map((blog) => (
                    <tr key={blog.id}>
                      <td>
                        <img
                          className="admin-table-thumbnail"
                          src={blog.coverImageUrl || 'https://placehold.co/88x58/e8f9f2/0d5c45?text=Blog'}
                          alt={blog.title}
                        />
                      </td>
                      <td>
                        <p className="admin-table-name">{blog.title}</p>
                        <small>{blog.excerpt || '-'}</small>
                      </td>
                      <td>{blog.authorName}</td>
                      <td>{blog.category || 'General'}</td>
                      <td>
                        <span className={`admin-status-badge ${statusClass(blog.status)}`}>{blog.status}</span>
                      </td>
                      <td>{blog.views}</td>
                      <td>{formatDate(blog.publishedAt || blog.createdAt)}</td>
                      <td>
                        <div className="admin-inline-actions">
                          <button
                            type="button"
                            className="admin-icon-button"
                            title="View"
                            onClick={() => setPreviewBlog(blog)}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button"
                            title="Edit"
                            onClick={() => openEditor(blog)}
                          >
                            ✏️
                          </button>
                          {blog.status === 'published' ? (
                            <button
                              type="button"
                              className="admin-icon-button"
                              title="Unpublish"
                              onClick={async () => {
                                try {
                                  const updated = await updateAdminBlog(blog.id, { status: 'unpublished' });
                                  setBlogs((previous) =>
                                    previous.map((item) => (item.id === updated.id ? updated : item))
                                  );
                                } catch {
                                  setError('Unable to unpublish blog.');
                                }
                              }}
                            >
                              📥
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="admin-icon-button danger"
                            title="Delete"
                            onClick={() => onDelete(blog)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {previewBlog ? (
        <section className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setPreviewBlog(null)}>
          <article className="admin-modal blog-preview-modal" onClick={(event) => event.stopPropagation()}>
            <header className="admin-card-head">
              <h3>Preview: {previewBlog.title}</h3>
              <button type="button" className="admin-link-button" onClick={() => setPreviewBlog(null)}>
                Close
              </button>
            </header>

            <div className="admin-blog-preview-layout">
              <article className="admin-blog-preview-content">
                {previewBlog.coverImageUrl ? <img src={previewBlog.coverImageUrl} alt={previewBlog.title} /> : null}
                <h2>{previewBlog.title}</h2>
                <p>{previewBlog.excerpt}</p>
                <div className="admin-markdown-render">{previewBlog.content}</div>
              </article>

              <aside className="admin-blog-preview-side">
                <h4>Article Metadata</h4>
                <p>Author: {previewBlog.authorName}</p>
                <p>Category: {previewBlog.category || 'General'}</p>
                <p>Tags: {(previewBlog.tags || []).join(', ') || '-'}</p>
                <p>Submitted: {formatDate(previewBlog.submittedAt || previewBlog.createdAt)}</p>
              </aside>
            </div>

            <footer className="admin-modal-footer">
              <div className="admin-reject-box">
                <textarea
                  rows={2}
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                />
                <div className="admin-inline-actions end">
                  <button type="button" className="admin-danger-button" onClick={() => onReject(previewBlog, rejectReason)}>
                    Reject with Feedback
                  </button>
                  <button type="button" className="admin-primary-button" onClick={() => onPublish(previewBlog)}>
                    Publish Article →
                  </button>
                </div>
              </div>
            </footer>
          </article>
        </section>
      ) : null}

      {isEditorOpen ? (
        <section className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setIsEditorOpen(false)}>
          <article className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <header className="admin-card-head">
              <h3>{editingBlogId ? 'Edit Blog' : 'Write Blog'}</h3>
              <button type="button" className="admin-link-button" onClick={() => setIsEditorOpen(false)}>
                Close
              </button>
            </header>

            <form className="admin-form-grid" onSubmit={saveBlog}>
              <label className="admin-form-span-2">
                Title
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>
              <label className="admin-form-span-2">
                Excerpt
                <textarea rows={2} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
              </label>
              <label className="admin-form-span-2">
                Cover Image URL
                <input type="url" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} />
              </label>
              <label>
                Category
                <input type="text" value={category} onChange={(event) => setCategory(event.target.value)} />
              </label>
              <label>
                Tags (comma separated)
                <input type="text" value={tags} onChange={(event) => setTags(event.target.value)} />
              </label>
              <label className="admin-form-span-2">
                Content
                <textarea rows={10} value={content} onChange={(event) => setContent(event.target.value)} required />
              </label>
              <div className="admin-inline-actions end admin-form-span-2">
                <button type="submit" className="admin-primary-button">
                  Publish
                </button>
              </div>
            </form>
          </article>
        </section>
      ) : null}
    </section>
  );
}
