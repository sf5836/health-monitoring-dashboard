import { FormEvent, useEffect, useState } from 'react';
import doctorService, { type DoctorBlog } from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<DoctorBlog[]>([]);
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Cardiology');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      const data = await doctorService.getMyBlogs();
      setBlogs(data);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load blogs');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      if (editingId) {
        await doctorService.updateMyBlog(editingId, { title, content, category });
      } else {
        await doctorService.createMyBlog({ title, content, category });
      }
      setEditingId('');
      setTitle('');
      setContent('');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to save blog');
    }
  };

  const edit = (blog: DoctorBlog) => {
    setEditingId(blog._id);
    setTitle(blog.title);
    setContent(blog.content);
    setCategory(blog.category || 'General');
  };

  const submit = async (blogId: string) => {
    try {
      await doctorService.submitMyBlog(blogId);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to submit blog');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>My Blogs</h2>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <section className="hm-card" style={{ marginBottom: '1rem' }}>
        <h3>{editingId ? 'Edit Blog' : 'Create Blog'}</h3>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '0.6rem' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" rows={6} required />
          <button className="hm-btn hm-btn-primary" type="submit">{editingId ? 'Update' : 'Create'}</button>
        </form>
      </section>
      {blogs.map((b) => (
        <article key={b._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
          <h4>{b.title}</h4>
          <p>{b.category || 'General'} | {b.status}</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="hm-btn hm-btn-outline" onClick={() => edit(b)}>Edit</button>
            {b.status === 'draft' ? <button className="hm-btn hm-btn-primary" onClick={() => submit(b._id)}>Submit</button> : null}
          </div>
        </article>
      ))}
    </main>
  );
}
