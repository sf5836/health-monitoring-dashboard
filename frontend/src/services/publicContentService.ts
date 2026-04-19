import { apiRequest } from './apiClient';

export type PublicDoctorCard = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  experienceYears: number;
  fee: string;
  feeValue: number;
  rating: number;
  reviewsCount: number;
  hospital: string;
  availability: string;
};

export type PublicDoctorListingQuery = {
  search?: string;
  specializations?: string[];
  minRating?: number;
  minFee?: number;
  maxFee?: number;
  availabilityDay?: string;
  sort?: 'latest' | 'rating' | 'experience' | 'fee_asc' | 'fee_desc';
  page?: number;
  limit?: number;
};

export type PublicDoctorListingResponse = {
  doctors: PublicDoctorCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    specializations: string[];
  };
};

export type PublicDoctorDetail = PublicDoctorCard & {
  bio: string;
  qualifications: string[];
};

export type PublicDoctorReview = {
  id: string;
  name: string;
  date: string;
  quote: string;
};

export type PublicBlogCard = {
  id: string;
  category: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
};

export type PublicTestimonialCard = {
  id: string;
  name: string;
  role: string;
  quote: string;
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
  rating?: number;
  reviewsCount?: number;
  hospital?: string;
  availability?: string;
  bio?: string;
  qualifications?: string[];
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
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
    filters?: {
      specializations?: string[];
    };
  };
};

type BlogListResponse = {
  success: boolean;
  data: {
    blogs: ApiBlog[];
  };
};

type ApiTestimonial = {
  id?: string;
  _id?: string;
  name?: string;
  role?: string;
  quote?: string;
};

type TestimonialListResponse = {
  success: boolean;
  data: {
    testimonials: ApiTestimonial[];
  };
};

type ApiDoctorReview = {
  id?: string;
  _id?: string;
  name?: string;
  date?: string;
  quote?: string;
};

type DoctorReviewListResponse = {
  success: boolean;
  data: {
    reviews: ApiDoctorReview[];
  };
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

function mapDoctor(item: ApiDoctor): PublicDoctorCard {
  const feeValue = item.fee ?? 0;
  const experienceYears = item.experienceYears ?? 0;

  return {
    id: item.userId?._id || item._id,
    name: item.userId?.fullName || 'Doctor',
    specialization: item.specialization || 'General Medicine',
    experience: `${experienceYears} years`,
    experienceYears,
    fee: `PKR ${feeValue.toLocaleString()} / consultation`,
    feeValue,
    rating: item.rating ?? 5,
    reviewsCount: item.reviewsCount ?? 0,
    hospital: item.hospital || 'HealthMonitor Pro Partner Hospital',
    availability: item.availability || 'Mon-Fri'
  };
}

function toQueryString(query: PublicDoctorListingQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.specializations && query.specializations.length > 0) {
    params.set('specializations', query.specializations.join(','));
  }
  if (query.minRating !== undefined) params.set('minRating', String(query.minRating));
  if (query.minFee !== undefined) params.set('minFee', String(query.minFee));
  if (query.maxFee !== undefined) params.set('maxFee', String(query.maxFee));
  if (query.availabilityDay) params.set('availabilityDay', query.availabilityDay);
  if (query.sort) params.set('sort', query.sort);
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.limit !== undefined) params.set('limit', String(query.limit));

  return params.toString();
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

function mapTestimonial(item: ApiTestimonial): PublicTestimonialCard {
  return {
    id: item.id || item._id || crypto.randomUUID(),
    name: item.name || 'Patient',
    role: item.role || 'Patient',
    quote: item.quote || ''
  };
}

function mapDoctorReview(item: ApiDoctorReview): PublicDoctorReview {
  const parsedDate = item.date ? new Date(item.date) : null;
  return {
    id: item.id || item._id || crypto.randomUUID(),
    name: item.name || 'Patient',
    date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? dateFormatter.format(parsedDate) : 'Recent',
    quote: item.quote || ''
  };
}

export async function getPublicDoctors(limit = 20): Promise<PublicDoctorCard[]> {
  const response = await apiRequest<DoctorListResponse>(`/doctors?limit=${limit}`);
  return (response.data.doctors || []).map(mapDoctor);
}

export async function getPublicDoctorsListing(
  query: PublicDoctorListingQuery
): Promise<PublicDoctorListingResponse> {
  const qs = toQueryString(query);
  const response = await apiRequest<DoctorListResponse>(`/doctors${qs ? `?${qs}` : ''}`);

  const mappedDoctors = (response.data.doctors || []).map(mapDoctor);
  const pagination = response.data.pagination || {};

  return {
    doctors: mappedDoctors,
    pagination: {
      page: pagination.page ?? query.page ?? 1,
      limit: pagination.limit ?? query.limit ?? 12,
      total: pagination.total ?? mappedDoctors.length,
      totalPages: pagination.totalPages ?? 1
    },
    filters: {
      specializations: response.data.filters?.specializations || []
    }
  };
}

export async function getPublicDoctorById(doctorId: string): Promise<PublicDoctorDetail> {
  const response = await apiRequest<{ success: boolean; data: { doctor: ApiDoctor } }>(
    `/doctors/${doctorId}/public`
  );

  const doctor = mapDoctor(response.data.doctor);
  return {
    ...doctor,
    bio: response.data.doctor.bio || 'Doctor profile information will be available soon.',
    qualifications: response.data.doctor.qualifications || []
  };
}

export async function getPublicDoctorReviews(
  doctorId: string,
  limit = 12
): Promise<PublicDoctorReview[]> {
  const response = await apiRequest<DoctorReviewListResponse>(
    `/doctors/${doctorId}/reviews/public?limit=${limit}`
  );
  return (response.data.reviews || []).map(mapDoctorReview).filter((item) => item.quote.trim().length > 0);
}

export async function getPublicBlogs(limit = 20): Promise<PublicBlogCard[]> {
  const response = await apiRequest<BlogListResponse>(`/blogs/public?limit=${limit}`);
  return (response.data.blogs || []).map(mapBlog);
}

export async function getPublicTestimonials(limit = 12): Promise<PublicTestimonialCard[]> {
  const response = await apiRequest<TestimonialListResponse>(`/doctors/reviews/public?limit=${limit}`);
  return (response.data.testimonials || []).map(mapTestimonial).filter((item) => item.quote.trim().length > 0);
}

export async function subscribeNewsletter(email: string): Promise<string> {
  const response = await apiRequest<{ message?: string }>(`/blogs/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  return response.message || 'Subscribed successfully';
}
