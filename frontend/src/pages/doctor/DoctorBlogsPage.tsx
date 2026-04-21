import { type KeyboardEvent, type MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDoctorBlog,
  getDoctorBlogs,
  getDoctorProfile,
  submitDoctorBlog,
  updateDoctorBlog,
  type DoctorBlog,
  type DoctorProfile
} from '../../services/doctorPortalService';
import { formatDate } from './doctorUi';

type BlogStatusFilter = 'all' | 'draft' | 'pending_review' | 'published' | 'rejected';

const CATEGORY_OPTIONS = ['Cardiology', 'Neurology', 'Diabetes', 'General Health', 'Lifestyle'];

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function statusLabel(status: DoctorBlog['status']): string {
  if (status === 'pending_review') return 'Under Review';
  if (status === 'published') return 'Live';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unpublished') return 'Unpublished';
  return 'Draft';
}

function insertAtCursor(
  textarea: MutableRefObject<HTMLTextAreaElement | null>,
  prefix: string,
  suffix = ''
) {
  const element = textarea.current;
  if (!element) return;

  const start = element.selectionStart;
  const end = element.selectionEnd;
  const text = element.value;
  const selected = text.slice(start, end);
  const next = `${text.slice(0, start)}${prefix}${selected}${suffix}${text.slice(end)}`;

  element.value = next;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

export default function DoctorBlogsPage() {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [blogs, setBlogs] = useState<DoctorBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingBlogId, setEditingBlogId] = useState('');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>('all');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [doctorProfile, doctorBlogs] = await Promise.all([getDoctorProfile(), getDoctorBlogs()]);

        if (cancelled) return;

        setProfile(doctorProfile);
        setBlogs(doctorBlogs);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load blog editor data right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const readTimeMinutes = useMemo(() => estimateReadTime(content), [content]);

  const counts = useMemo(() => {
    return {
      draft: blogs.filter((item) => item.status === 'draft').length,
      pending_review: blogs.filter((item) => item.status === 'pending_review').length,
      published: blogs.filter((item) => item.status === 'published').length,
      rejected: blogs.filter((item) => item.status === 'rejected').length
    };
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    if (statusFilter === 'all') return blogs;
    return blogs.filter((item) => item.status === statusFilter);
  }, [blogs, statusFilter]);

  function resetEditor() {
    setEditingBlogId('');
    setTitle('');
    setExcerpt('');
    setContent('');
    setCoverImageUrl('');
    setCategory('');
    setTags([]);
    setTagInput('');
  }

  function loadBlogIntoEditor(blog: DoctorBlog) {
    setEditingBlogId(blog.id);
    setTitle(blog.title);
    setExcerpt(blog.excerpt || '');
    setContent(blog.content || '');
    setCoverImageUrl(blog.coverImageUrl || '');
    setCategory(blog.category || '');
    setTags(blog.tags || []);
    setTagInput('');
  }

  async function saveDraft() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required to save draft.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content: content.trim(),
        coverImageUrl: coverImageUrl.trim() || undefined,
        category: category.trim() || undefined,
        tags
      };

      let saved: DoctorBlog;
      if (editingBlogId) {
        saved = await updateDoctorBlog(editingBlogId, payload);
      } else {
        saved = await createDoctorBlog(payload);
      }

      setBlogs((previous) => [saved, ...previous.filter((item) => item.id !== saved.id)]);
      setEditingBlogId(saved.id);
      setError('');
    } catch {
      setError('Unable to save blog draft right now.');
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required before submitting for review.');
      return;
    }

    try {
      setSubmitting(true);

      let blogId = editingBlogId;

      if (!blogId) {
        const created = await createDoctorBlog({
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          category: category.trim() || undefined,
          tags
        });

        blogId = created.id;
        setEditingBlogId(created.id);
        setBlogs((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);
      } else {
        const updated = await updateDoctorBlog(blogId, {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          category: category.trim() || undefined,
          tags
        });
        setBlogs((previous) => [updated, ...previous.filter((item) => item.id !== updated.id)]);
      }

      const submitted = await submitDoctorBlog(blogId);
      setBlogs((previous) => [submitted, ...previous.filter((item) => item.id !== submitted.id)]);
      setError('');
    } catch {
      setError('Unable to submit blog for review right now.');
    } finally {
      setSubmitting(false);
    }
  }

  function onAddTag(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const normalized = tagInput.trim();
    if (!normalized) return;

    if (tags.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setTagInput('');
      return;
    }

    setTags((previous) => [...previous, normalized]);
    setTagInput('');
  }

  function onUploadCover(file: File | undefined) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      setCoverImageUrl(value);
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return <p className="doctor-page-status">Loading blog editor...</p>;
  }

  return (
    <section className="doctor-page doctor-blog-page">
      <header className="doctor-page-head">
        <div>
          <p className="doctor-breadcrumb">Dashboard / My Blogs / New Blog</p>
          <h2>Write a Health Article</h2>
        </div>
        <div className="doctor-inline-actions">
          <button type="button" className="doctor-secondary-button" onClick={saveDraft} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" className="doctor-primary-button" onClick={submitForReview} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </header>

      {error ? <p className="doctor-error-banner">{error}</p> : null}

      <section className="doctor-blog-editor-grid">
        <article className="doctor-card doctor-blog-editor-card">
          <input
            className="doctor-blog-title-input"
            type="text"
            placeholder="Article title..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <textarea
            className="doctor-blog-excerpt-input"
            placeholder="Brief description of your article - shown in listing pages..."
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={2}
          />

          <label className="doctor-cover-upload-zone">
            {coverImageUrl ? (
              <img src={coverImageUrl} alt="Cover preview" className="doctor-cover-preview" />
            ) : (
              <span>Drop cover image here or click to upload</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onUploadCover(event.target.files?.[0])}
              hidden
            />
          </label>

          <div className="doctor-editor-toolbar">
            <button type="button" onClick={() => insertAtCursor(editorRef, '## ', '')}>
              H2
            </button>
            <button type="button" onClick={() => insertAtCursor(editorRef, '### ', '')}>
              H3
            </button>
            <button type="button" onClick={() => insertAtCursor(editorRef, '**', '**')}>
              B
            </button>
            <button type="button" onClick={() => insertAtCursor(editorRef, '_', '_')}>
              I
            </button>
            <button type="button" onClick={() => insertAtCursor(editorRef, '- ', '')}>
              Bullet
            </button>
            <button type="button" onClick={() => insertAtCursor(editorRef, '> ', '')}>
              Quote
            </button>
            <button type="button" onClick={() => insertAtCursor(editorRef, '```\n', '\n```')}>
              Code
            </button>
          </div>

          <textarea
            ref={editorRef}
            className="doctor-content-editor"
            placeholder="Start writing your article... Share your medical expertise with patients."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={18}
          />
        </article>

        <aside className="doctor-blog-settings-sidebar">
          <article className="doctor-card">
            <h3>Publish Settings</h3>
            <label>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Select category...</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tags
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={onAddTag}
                placeholder="Type a tag and press Enter"
              />
            </label>

            <div className="doctor-tag-row">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="doctor-data-chip"
                  onClick={() => setTags((previous) => previous.filter((item) => item !== tag))}
                >
                  {tag} ✕
                </button>
              ))}
            </div>

            <p className="doctor-micro-copy">Estimated read time: ~{readTimeMinutes} min read</p>
          </article>

          <article className="doctor-card">
            <h3>Status</h3>
            <p className="doctor-micro-copy">
              Current status:{' '}
              <span className={`doctor-status-chip status-${editingBlogId ? (blogs.find((item) => item.id === editingBlogId)?.status || 'draft') : 'draft'}`}>
                {editingBlogId ? statusLabel(blogs.find((item) => item.id === editingBlogId)?.status || 'draft') : 'Draft'}
              </span>
            </p>
            <p className="doctor-micro-copy">Your article will be reviewed by admin before going live.</p>
          </article>

          <article className="doctor-card">
            <h3>Author</h3>
            <p>{profile?.user.fullName || 'Doctor'}</p>
            <small>{profile?.specialization || 'Specialist'}</small>
            <p className="doctor-micro-copy">This article will be published under your name.</p>
          </article>
        </aside>
      </section>

      <footer className="doctor-blog-action-footer">
        <button type="button" className="doctor-link-button" onClick={resetEditor}>
          ← Cancel
        </button>
        <div className="doctor-inline-actions">
          <button type="button" className="doctor-secondary-button" onClick={saveDraft} disabled={saving}>
            Save Draft
          </button>
          <button type="button" className="doctor-secondary-button" onClick={() => setError('Preview mode can be built in next phase.') }>
            Preview
          </button>
          <button type="button" className="doctor-primary-button" onClick={submitForReview} disabled={submitting}>
            Submit for Review →
          </button>
        </div>
      </footer>

      <section className="doctor-card doctor-blog-list-card">
        <div className="doctor-tab-row">
          <button
            type="button"
            className={`doctor-tab-pill ${statusFilter === 'draft' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            Draft ({counts.draft})
          </button>
          <button
            type="button"
            className={`doctor-tab-pill ${statusFilter === 'pending_review' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('pending_review')}
          >
            Pending Review ({counts.pending_review})
          </button>
          <button
            type="button"
            className={`doctor-tab-pill ${statusFilter === 'published' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('published')}
          >
            Published ({counts.published})
          </button>
          <button
            type="button"
            className={`doctor-tab-pill ${statusFilter === 'rejected' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected ({counts.rejected})
          </button>
          <button
            type="button"
            className={`doctor-tab-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({blogs.length})
          </button>
        </div>

        <div className="doctor-table-wrap">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="doctor-empty-state">No blogs found for this status.</p>
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <p className="doctor-table-name">{blog.title}</p>
                    </td>
                    <td>{blog.category || 'General'}</td>
                    <td>
                      <span className={`doctor-status-chip status-${blog.status}`}>{statusLabel(blog.status)}</span>
                    </td>
                    <td>{formatDate(blog.updatedAt || blog.createdAt)}</td>
                    <td>{blog.views}</td>
                    <td>
                      <div className="doctor-inline-actions">
                        <button type="button" className="doctor-secondary-button compact" onClick={() => loadBlogIntoEditor(blog)}>
                          Edit
                        </button>
                        {blog.status === 'draft' ? (
                          <button
                            type="button"
                            className="doctor-primary-button compact"
                            onClick={async () => {
                              try {
                                const submitted = await submitDoctorBlog(blog.id);
                                setBlogs((previous) => [submitted, ...previous.filter((item) => item.id !== submitted.id)]);
                              } catch {
                                setError('Unable to submit this draft right now.');
                              }
                            }}
                          >
                            Submit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
