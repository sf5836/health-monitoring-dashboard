import { apiRequest } from './apiClient';

export type PublicDoctorCard = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  fee: string;
  rating: number;
};

export type PublicBlogCard = {
  id: string;
  category: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
};

type ApiDoctor = {
  _id: string;
  userId?: {
    _id?: string;
    fullName?: string;
  };
  specialization?: string;
  experienceYears?: number;
  fee?: number;
};

type ApiBlog = {
  _id: string;
  category?: string;
  title?: string;
  authorId?: {
    fullName?: string;
  };
  publishedAt?: string;
  excerpt?: string;
  content?: string;
};

type DoctorListResponse = {
  success: boolean;
  data: {
    doctors: ApiDoctor[];
  };
};

type BlogListResponse = {
  success: boolean;
  data: {
    blogs: ApiBlog[];
  };
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

function mapDoctor(item: ApiDoctor): PublicDoctorCard {
  return {
    id: item.userId?._id || item._id,
    name: item.userId?.fullName || 'Doctor',
    specialization: item.specialization || 'General Medicine',
    experience: `${item.experienceYears ?? 0} years`,
    fee: `PKR ${(item.fee ?? 0).toLocaleString()}/consult`,
    rating: 5
  };
}

function mapBlog(item: ApiBlog): PublicBlogCard {
  const date = item.publishedAt ? dateFormatter.format(new Date(item.publishedAt)) : 'Recent';
  return {
    id: item._id,
    category: item.category || 'General Health',
    title: item.title || 'Untitled article',
    author: item.authorId?.fullName || 'HealthMonitor Pro Team',
    date,
    excerpt: item.excerpt || item.content?.slice(0, 120) || 'Read more from HealthMonitor Pro experts.'
  };
}

export async function getPublicDoctors(limit = 20): Promise<PublicDoctorCard[]> {
  const response = await apiRequest<DoctorListResponse>(`/doctors?limit=${limit}`);
  return (response.data.doctors || []).map(mapDoctor);
}

export async function getPublicBlogs(limit = 20): Promise<PublicBlogCard[]> {
  const response = await apiRequest<BlogListResponse>(`/blogs/public?limit=${limit}`);
  return (response.data.blogs || []).map(mapBlog);
}

export async function subscribeNewsletter(email: string): Promise<string> {
  const response = await apiRequest<{ message?: string }>(`/blogs/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  return response.message || 'Subscribed successfully';
}
