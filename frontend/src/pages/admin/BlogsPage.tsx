import { FormEvent, useEffect, useState } from 'react';
import adminService, { type AdminBlogRecord } from '../../services/adminService';
import { ApiError } from '../../services/apiClient';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<AdminBlogRecord[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      const data = showAll ? await adminService.getBlogs() : await adminService.getPendingBlogs();
      setBlogs(data);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load blogs');
    }
  };

  useEffect(() => {
    loadData();
  }, [showAll]);

  const moderate = async (blogId: string, action: 'publish' | 'reject') => {
    try {
      if (action === 'publish') {
        await adminService.publishBlog(blogId);
      } else {
        await adminService.rejectBlog(blogId, 'Rejected by admin');
      }
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : `Failed to ${action} blog`);
    }
  };

  const createBlog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await adminService.createBlog({ title, content, category, status: 'published' });
      setTitle('');
      setContent('');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to create blog');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Admin Blogs</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Show all blogs
      </label>
      <section className="hm-card" style={{ margin: '1rem 0' }}>
        <h3>Create Admin Blog</h3>
        <form onSubmit={createBlog} style={{ display: 'grid', gap: '0.6rem' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" rows={5} required />
          <button className="hm-btn hm-btn-primary" type="submit">Publish</button>
        </form>
      </section>
      {blogs.map((b) => (
        <article key={b._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
          <h4>{b.title}</h4>
          <p>{b.authorId?.fullName || 'Author'} | {b.status}</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="hm-btn hm-btn-outline" onClick={() => moderate(b._id, 'publish')}>Publish</button>
            <button className="hm-btn hm-btn-outline" onClick={() => moderate(b._id, 'reject')}>Reject</button>
          </div>
        </article>
      ))}
    </main>
  );
}
