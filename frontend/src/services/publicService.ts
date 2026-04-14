import { apiRequest } from './apiClient';

export type PublicDoctor = {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
  };
  specialization?: string;
  qualifications?: string[];
  experienceYears?: number;
  hospital?: string;
  fee?: number;
  bio?: string;
  availability?: string;
};

export type PublicBlog = {
  _id: string;
  title: string;
  excerpt?: string;
  content: string;
  category?: string;
  tags?: string[];
  authorId?: {
    _id: string;
    fullName: string;
  };
  publishedAt?: string;
  createdAt?: string;
  views?: number;
};

async function getPublicDoctors(): Promise<PublicDoctor[]> {
  const data = await apiRequest<{ doctors: PublicDoctor[] }>('/doctors');
  return data.doctors;
}

async function getPublicDoctorById(doctorId: string): Promise<PublicDoctor> {
  const data = await apiRequest<{ doctor: PublicDoctor }>(`/doctors/${doctorId}/public`);
  return data.doctor;
}

async function getPublicBlogs(): Promise<PublicBlog[]> {
  const data = await apiRequest<{ blogs: PublicBlog[] }>('/blogs/public');
  return data.blogs;
}

async function getPublicBlogById(blogId: string): Promise<PublicBlog> {
  const data = await apiRequest<{ blog: PublicBlog }>(`/blogs/public/${blogId}`);
  return data.blog;
}

const publicService = {
  getPublicDoctors,
  getPublicDoctorById,
  getPublicBlogs,
  getPublicBlogById
};

export default publicService;
